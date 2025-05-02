# LinkedIn Recruiter Tool

A professional recruiting application built with Electron and React for managing candidates, evaluating prospects, and streamlining outreach communications.

## Features

- **Secure Login**: Authentication system for LinkedIn credentials
- **Candidate Dashboard**: Overview of recruiting pipeline with key metrics
- **Candidate Profiles**: Detailed view of candidate information and evaluation
- **Messaging System**: Customizable templates for candidate outreach
- **Evaluation Framework**: Configurable criteria for candidate assessment
- **Responsive Design**: Works well on various screen sizes

## Technology Stack

- **Electron**: For building cross-platform desktop application
- **React**: UI framework for component-based architecture
- **TailwindCSS**: Utility-first CSS framework for styling
- **React Router**: For navigation between different sections
- **Formik & Yup**: Form handling and validation
- **Recharts**: Data visualization library

## Project Structure

```
linkedin-recruiter/
├── package.json           # Project dependencies and scripts
├── electron/              # Electron main process code
│   ├── main.js            # Main Electron process
│   ├── preload.js         # Preload script for secure context bridge
│   └── security.js        # Security policies and credential handling
├── src/                   # React application code
│   ├── index.js           # React entry point
│   ├── App.js             # Main React component
│   ├── contexts/          # React context providers
│   ├── components/        # UI components
│   ├── pages/             # Full page components
│   ├── services/          # API and service functions
│   ├── utils/             # Utility functions
│   └── assets/            # Static assets
└── public/                # Public static files
```

## Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/linkedin-recruiter.git
cd linkedin-recruiter
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm start
```

This will start both React and Electron in development mode. React will run on http://localhost:3000, and Electron will load this URL.

4. **Building for production**

```bash
npm run build
```

This creates an optimized production build in the `build` folder and packages the Electron app.

## Security Features

- Context isolation to securely separate the Electron and renderer processes
- Secure storage of LinkedIn credentials using electron-store with encryption
- Proper event handling to prevent memory leaks
- CSP headers to prevent XSS attacks

## Customization

- **Evaluation Criteria**: Modify the criteria in the Settings page
- **Message Templates**: Create and save custom outreach templates
- **UI Theme**: Customize the TailwindCSS configuration in `tailwind.config.js`

## License

MIT