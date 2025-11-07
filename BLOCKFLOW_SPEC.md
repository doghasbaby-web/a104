# BlockFlow Language Specification v1.0

## Overview
BlockFlow is a meta-language that treats code modules as atomic, self-contained blocks (like Lego pieces) and focuses on describing relationships and data flow between them.

---

## Core Concepts

### 1. Block Definition
A **Block** is a logically resilient, internally complete unit of functionality written in any programming language.

```blockflow
@block UserAuthenticator {
  language: "python"
  version: "1.0"

  inputs: {
    username: string
    password: string
  }

  outputs: {
    token: string
    user_id: integer
    success: boolean
  }

  errors: [AuthError, NetworkError]

  internal: "./auth_module.py"
}
```

### 2. Block Properties

**Required Attributes:**
- `language`: The implementation language
- `inputs`: Data the block accepts
- `outputs`: Data the block produces
- `internal`: Path to implementation code

**Optional Attributes:**
- `version`: Block version for compatibility
- `errors`: Possible error types
- `state`: Whether block maintains state (stateful/stateless)
- `side_effects`: External effects (database, API, file system)
- `dependencies`: External libraries needed

---

## Relationship Operators

### Sequential Flow (`->`)
Execute blocks in sequence, passing output to input.

```blockflow
UserAuthenticator -> SessionManager -> DashboardLoader
```

### Parallel Flow (`||`)
Execute blocks simultaneously.

```blockflow
DataFetcher || CacheLoader || UserPreferences
```

### Conditional Flow (`?`)
Execute block based on condition.

```blockflow
UserAuthenticator -> ? success {
  true: SessionManager -> Dashboard
  false: ErrorHandler -> LoginPage
}
```

### Loop Flow (`@repeat`)
Repeat block execution.

```blockflow
@repeat while(hasMoreData) {
  DataFetcher -> DataProcessor -> DataSaver
}
```

### Merge Flow (`+`)
Combine outputs from multiple blocks.

```blockflow
(UserData + Permissions + Settings) -> ProfileBuilder
```

### Fork Flow (`=>`)
Send output to multiple blocks.

```blockflow
PaymentProcessor => {
  ReceiptGenerator
  InventoryUpdater
  NotificationSender
}
```

---

For complete specification, see the README.md file.
