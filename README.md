# ProScanner - AI-Powered Barcode Billing for Modern Retail

ProScanner is a cloud-based SaaS retail POS platform that enables retail shops to scan barcodes instantly, manage inventory, create invoices, and predict demand using AI.

## Features
- **Multi-Tenant Architecture**: Isolated data for each retail business.
- **Product Inventory**: Manage products, barcodes, pricing, and stock.
- **POS Billing Screen**: High-speed POS interface with barcode scanning via webcam.
- **Receipt Generator**: Printable receipts for customers.
- **Analytics Dashboard**: View daily revenue, sales, and active customers.
- **AI Chatbot**: Gemini-powered assistant for retail management advice.
- **Image Generation**: Generate high-quality product images using Gemini.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, Zustand, React Query
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose) - *Mocked in preview*
- **AI**: Google Gemini API (@google/genai)

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (optional, uses mock data if not provided)
- Gemini API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY` and `MONGO_URI` (optional).
4. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Deployment

To deploy using Docker Compose:

```bash
docker-compose up -d
```

## License
MIT
