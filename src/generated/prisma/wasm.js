
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  telegramId: 'telegramId',
  username: 'username',
  firstName: 'firstName',
  lastName: 'lastName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastActive: 'lastActive'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  walletAddress: 'walletAddress',
  encryptedPrivateKey: 'encryptedPrivateKey',
  encryptionIV: 'encryptionIV',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastUsed: 'lastUsed'
};

exports.Prisma.MarketScalarFieldEnum = {
  id: 'id',
  polymarketId: 'polymarketId',
  question: 'question',
  description: 'description',
  endDate: 'endDate',
  volume24h: 'volume24h',
  liquidity: 'liquidity',
  yesPrice: 'yesPrice',
  noPrice: 'noPrice',
  priceChange24h: 'priceChange24h',
  yesTokenId: 'yesTokenId',
  noTokenId: 'noTokenId',
  conditionId: 'conditionId',
  clobTokensIds: 'clobTokensIds',
  isActive: 'isActive',
  isArchived: 'isArchived',
  lastUpdated: 'lastUpdated',
  createdAt: 'createdAt'
};

exports.Prisma.PositionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  marketId: 'marketId',
  tokenId: 'tokenId',
  amount: 'amount',
  side: 'side',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransferScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  transactionHash: 'transactionHash',
  from: 'from',
  to: 'to',
  value: 'value',
  token: 'token',
  chain: 'chain',
  blockNumber: 'blockNumber',
  timestamp: 'timestamp',
  createdAt: 'createdAt'
};

exports.Prisma.BalanceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  chain: 'chain',
  pol: 'pol',
  usdc: 'usdc',
  timestamp: 'timestamp'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Wallet: 'Wallet',
  Market: 'Market',
  Position: 'Position',
  Transfer: 'Transfer',
  Balance: 'Balance'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/thigas/Documents/GitHub/polymarket-test/src/generated/prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "/Users/thigas/Documents/GitHub/polymarket-test/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "PRISMA_DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  previewFeatures = [\"driverAdapters\"]\n  output          = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"PRISMA_DATABASE_URL\")\n}\n\nmodel User {\n  id         String   @id @default(cuid())\n  telegramId String   @unique\n  username   String?\n  firstName  String?\n  lastName   String?\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n  lastActive DateTime @default(now())\n\n  // Relations\n  wallet    Wallet?\n  positions Position[]\n  transfers Transfer[]\n  balances  Balance[]\n\n  @@map(\"users\")\n}\n\nmodel Wallet {\n  id                  String   @id @default(cuid())\n  userId              String   @unique\n  walletAddress       String   @unique\n  encryptedPrivateKey String   @db.Text\n  encryptionIV        String // Store IV for each encrypted key\n  createdAt           DateTime @default(now())\n  updatedAt           DateTime @updatedAt\n  lastUsed            DateTime @default(now())\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map(\"wallets\")\n}\n\nmodel Market {\n  id             String   @id @default(cuid())\n  polymarketId   String   @unique // The original Polymarket condition_id\n  question       String\n  description    String?\n  endDate        DateTime\n  volume24h      Float    @default(0)\n  liquidity      Float    @default(0)\n  yesPrice       Float    @default(0.5)\n  noPrice        Float    @default(0.5)\n  priceChange24h Float?\n  yesTokenId     String\n  noTokenId      String\n  conditionId    String?\n  clobTokensIds  String?\n  isActive       Boolean  @default(true)\n  isArchived     Boolean  @default(false)\n  lastUpdated    DateTime @default(now())\n  createdAt      DateTime @default(now())\n\n  // Relations\n  positions Position[]\n\n  @@map(\"markets\")\n}\n\nmodel Position {\n  id        String   @id @default(cuid())\n  userId    String\n  marketId  String\n  tokenId   String\n  amount    Float\n  side      String // 'buy' or 'sell'\n  price     Float\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  market Market @relation(fields: [marketId], references: [id], onDelete: Cascade)\n\n  @@map(\"positions\")\n}\n\nmodel Transfer {\n  id              String   @id @default(cuid())\n  userId          String\n  transactionHash String   @unique\n  from            String\n  to              String\n  value           String // Amount as string to preserve precision\n  token           String // Token symbol (POL, USDC, etc.)\n  chain           String // Chain name (polygon, etc.)\n  blockNumber     Int\n  timestamp       DateTime\n  createdAt       DateTime @default(now())\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map(\"transfers\")\n}\n\nmodel Balance {\n  id        String   @id @default(cuid())\n  userId    String\n  chain     String\n  pol       String // POL balance as string\n  usdc      String // USDC balance as string\n  timestamp DateTime @default(now())\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@map(\"balances\")\n}\n",
  "inlineSchemaHash": "21d759b6c5df5a980efd00a41035a6699b10766bd524acd3dec6a4826a866071",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"telegramId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"username\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"firstName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lastName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"lastActive\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"wallet\",\"kind\":\"object\",\"type\":\"Wallet\",\"relationName\":\"UserToWallet\"},{\"name\":\"positions\",\"kind\":\"object\",\"type\":\"Position\",\"relationName\":\"PositionToUser\"},{\"name\":\"transfers\",\"kind\":\"object\",\"type\":\"Transfer\",\"relationName\":\"TransferToUser\"},{\"name\":\"balances\",\"kind\":\"object\",\"type\":\"Balance\",\"relationName\":\"BalanceToUser\"}],\"dbName\":\"users\"},\"Wallet\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"walletAddress\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"encryptedPrivateKey\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"encryptionIV\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"lastUsed\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToWallet\"}],\"dbName\":\"wallets\"},\"Market\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"polymarketId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"question\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"endDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"volume24h\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"liquidity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"yesPrice\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"noPrice\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"priceChange24h\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"yesTokenId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"noTokenId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"conditionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"clobTokensIds\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"isArchived\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"lastUpdated\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"positions\",\"kind\":\"object\",\"type\":\"Position\",\"relationName\":\"MarketToPosition\"}],\"dbName\":\"markets\"},\"Position\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"marketId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tokenId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"amount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"side\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PositionToUser\"},{\"name\":\"market\",\"kind\":\"object\",\"type\":\"Market\",\"relationName\":\"MarketToPosition\"}],\"dbName\":\"positions\"},\"Transfer\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"transactionHash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"from\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"to\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"value\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"chain\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"blockNumber\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"TransferToUser\"}],\"dbName\":\"transfers\"},\"Balance\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"chain\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"pol\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"usdc\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"BalanceToUser\"}],\"dbName\":\"balances\"}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    PRISMA_DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['PRISMA_DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.PRISMA_DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

