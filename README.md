# HA SALES MANAGER

**HA SALES MANAGER** is a web-based management system designed for businesses that handle coil sales, invoicing, and client relationships. The application provides a comprehensive dashboard to manage clients, sales, invoices, payments, and analytics—all in one place.

## Features

- **Client Management**: Add, update, and view business clients and their details.
- **Sales Tracking**: Record sales of coil materials, including attributes like thickness, width, color, and weight.
- **Invoice Management**: Create and manage invoices, track payment status, and associate invoices with sales.
- **Payments**: Log payments by different methods (cash, bank transfer, check, credit card) and track outstanding debts.
- **Dashboard & Analytics**: Visualize key business metrics, sales trends, outstanding debts, and top clients.
- **Reports**: Generate and export detailed reports and analytics on sales and invoices.
- **Authentication**: Secure login and user management.

## Technologies Used

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (for backend/database)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

```sh
# Clone the repository
git clone https://github.com/z4ki/coil-commerce-control.git
cd coil-commerce-control

# Install dependencies
npm install

# Start the development server
npm run dev
```

By default, the app runs on [http://localhost:5173](http://localhost:5173).

### Configuration

You may need to configure environment variables to connect to your Supabase backend. See `.env.example` or project documentation for details.

### Usage

- Open your browser and visit `http://localhost:5173`.
- Log in or sign up to start managing clients, sales, invoices, and payments.
- Use the sidebar to navigate between Dashboard, Clients, Sales, Invoices, Reports, and Settings.

## License

MIT

---

> _Project maintained by [z4ki](https://github.com/z4ki)._
