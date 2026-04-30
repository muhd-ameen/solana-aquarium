/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/aquarium.json`.
 */
export type Aquarium = {
  "address": "Hb9mNuHBMNapZ6aewU6a3HKNnJ2nYhMxrhZHM43YKNTo",
  "metadata": {
    "name": "aquarium",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Solana Aquarium — shared on-chain fish tank"
  },
  "instructions": [
    {
      "name": "breed",
      "discriminator": [
        215,
        166,
        48,
        89,
        209,
        205,
        125,
        11
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "parentA",
            "parentB"
          ]
        },
        {
          "name": "parentA"
        },
        {
          "name": "parentB"
        },
        {
          "name": "child",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "childNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "feed",
      "discriminator": [
        46,
        213,
        237,
        176,
        190,
        113,
        182,
        94
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fish"
          ]
        },
        {
          "name": "fish",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "mintFish",
      "discriminator": [
        143,
        130,
        50,
        98,
        134,
        241,
        151,
        49
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "fish",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferFish",
      "discriminator": [
        152,
        33,
        97,
        135,
        196,
        37,
        237,
        190
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "fish"
          ]
        },
        {
          "name": "fish",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "fish",
      "discriminator": [
        123,
        52,
        122,
        216,
        206,
        125,
        64,
        149
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "parentStarving",
      "msg": "Parent fish is starving — feed it before breeding"
    },
    {
      "code": 6001,
      "name": "fishDead",
      "msg": "Fish has died — fully grown fish perish after 2 days without food"
    }
  ],
  "types": [
    {
      "name": "fish",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "species",
            "type": "u8"
          },
          {
            "name": "color",
            "type": "u8"
          },
          {
            "name": "speed",
            "type": "u8"
          },
          {
            "name": "size",
            "type": "u8"
          },
          {
            "name": "bornAt",
            "type": "i64"
          },
          {
            "name": "lastFed",
            "type": "i64"
          },
          {
            "name": "nonce",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "growth",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
