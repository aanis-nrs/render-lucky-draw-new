const namesInput = document.querySelector('#names');
const draw = document.querySelector('#draw');
const reset = document.querySelector('#reset');
const result = document.querySelector('#result');
const message = document.querySelector('#message');
const wheel = document.querySelector('#wheel');
const remove = document.querySelector('#remove');
const ctx = wheel.getContext('2d');
const colors = ['#f1729a', '#806de3', '#40b8b3', '#f1ad5e', '#588cde', '#bd78c8'];
let rotation = 0;
const getNames = () => namesInput.value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);

function paintWheel(names) {
  const shown = names.length ? names : ['Add names', 'Spin to win'];
  const count = shown.length;
  const slice = Math.PI * 2 / count;
  ctx.clearRect(0, 0, 800, 800);
  shown.forEach((name, i) => {
    const start = -Math.PI / 2 + i * slice;
    const middle = start + slice / 2;
    ctx.beginPath(); ctx.moveTo(400, 400); ctx.arc(400, 400, 385, start, start + slice); ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(400, 400); ctx.rotate(middle);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(8, Math.min(32, 440 / count))}px system-ui`;
    ctx.fillText(name, 360, 0, 290); ctx.restore();
  });
}
function resetWheel(names) {
  wheel.style.transition = 'none'; rotation = 0; wheel.style.transform = 'rotate(0deg)';
  paintWheel(names);
}
namesInput.addEventListener('input', () => resetWheel(getNames()));
paintWheel([]);

draw.addEventListener('click', async () => {
  const names = getNames();
  if (!names.length) { message.textContent = 'Please add at least one name.'; return; }
  draw.disabled = reset.disabled = namesInput.disabled = remove.disabled = true;
  resetWheel(names);
  result.textContent = 'Picking…'; message.textContent = 'Asking the server…';
  try {
    const response = await fetch('/api/draw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Draw failed.');
    if (!Number.isInteger(data.index) || data.index < 0 || data.index >= names.length || data.winner !== names[data.index]) throw new Error('Invalid server response.');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 0 : 4500;
    // The pointer is at 12 o’clock; the server-selected slice ends under it.
    rotation = 360 * 6 + (360 - ((data.index + 0.5) * 360 / names.length)) % 360;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    wheel.style.transition = `transform ${duration}ms cubic-bezier(.12,.72,.12,1)`;
    wheel.style.transform = `rotate(${rotation}deg)`;
    await new Promise(resolve => setTimeout(resolve, duration));
    result.textContent = data.winner;
    message.textContent = 'Congratulations! ✨';
    if (remove.checked) {
      names.splice(data.index, 1); namesInput.value = names.join('\n');
      message.textContent = 'Congratulations! Winner removed from the next draw. ✨';
    }
  } catch (error) { result.textContent = 'Try again'; message.textContent = error.message || 'Connection error.'; }
  finally { draw.disabled = reset.disabled = namesInput.disabled = remove.disabled = false; }
});
reset.addEventListener('click', () => { namesInput.value = ''; remove.checked = true; result.textContent = 'Ready when you are'; message.textContent = 'Add some names and spin the wheel.'; resetWheel([]); });
