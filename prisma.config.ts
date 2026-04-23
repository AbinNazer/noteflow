import path from "node:path"

const config = {
  earlyAccess: true,
  schema: path.join(__dirname, "prisma/schema.prisma"),
  migrate: {}
}

export default config
