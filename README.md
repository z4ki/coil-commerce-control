# Coil Commerce Control

## Project Overview

**Coil Commerce Control** is a business management web application designed for companies dealing with steel coil sales, slitting, and related services. It streamlines the process of managing clients, sales, invoices, payments, and  providing a modern and efficient interface for day-to-day operations.

### Key Features

- **Client Management:** Add, edit, and track clients with full contact and tax information.
- **Sales Management:** Create and manage sales records, including detailed product types (e.g., TN40, Steel Slitting) and itemized sale entries.
- **Invoice Generation:** Generate, edit, and track invoices linked to sales, with support for payment status and due dates.
- **Payment Tracking:** Record and manage payments, track outstanding balances, and handle multiple payment methods.
- **Reporting:** Generate reports on sales, outstanding debts, and client activity.
- **Modern UI:** Built with React, shadcn-ui, and Tailwind CSS for a responsive and user-friendly experience.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** shadcn-ui, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Build/Runtime:** Node.js, Bun, Tauri (for desktop builds)

## Getting Started

### Prerequisites

- Node.js & npm (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Bun (for Tauri desktop builds)
- (Optional) Tauri CLI for building native apps

### Running the Project (Web)

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Running as a Desktop App (Tauri)

```sh
# Install Bun if not already installed
npm install -g bun

# Start the Tauri development build
bun tauri dev
```

## Deployment

- Deploy via [Lovable](https://lovable.dev/projects/09b14231-b5b7-48b7-b71e-6f0fa9558ae3) for instant web publishing.
- You can also connect a custom domain via Lovable project settings.

## Contributing

- All type definitions are consolidated in `src/types/` for consistency.
- Use the provided form components and services for adding new features.
- Please ensure type safety and validation when extending forms or database logic.

## License

This project is proprietary and intended for internal business use.

---

For more details, see the codebase or contact the project maintainers.
