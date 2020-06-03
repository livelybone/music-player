const avatars = [...Array(15)].map(
  (v, i) => `/examples/imgs/avatars/${i + 1}.jpeg`,
)

export function getAvatar() {
  return avatars[Math.round(Math.random() * (avatars.length - 1))]
}
