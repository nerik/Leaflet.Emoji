module.exports = {
    "env": {
        "browser": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
      "sourceType": "module",
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "no-console": [
          "error",
          { "allow": ["warn", "error","log"] }
        ]
    },
    "globals": {
      "L": false,
      "topojson": false
    }
};
