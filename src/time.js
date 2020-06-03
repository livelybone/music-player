export function fill(num, len, placeholder = '0') {
  const $num = num.toString()
  if ($num.length >= len) return $num
  return [...Array(len - $num.length + 1)].join(placeholder) + $num
}

export function formatTime(duration) {
  const time = +duration || 0
  const hour = `${Math.floor(time / (60 * 60))}`
  const minute = `${Math.floor((time % (60 * 60)) / 60)}`
  const second = `${Math.floor(time % 60)}`
  return `${fill(hour, 2)}:${fill(minute, 2)}:${fill(second, 2)}`
}
