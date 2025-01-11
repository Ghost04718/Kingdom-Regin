import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "kingdomGameAssets",
  access: (allow) => ({
    "assets/{entity_id}/*": [
      allow.entity("identity").to(["read"]),
    ],
    "saves/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
});