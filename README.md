# 💼 Personal Finance App - Frontend

🌐 **A modern Angular-based frontend for sophisticated personal finance management**

This is the frontend application for a personal finance management platform that helps users track, categorize, and analyze their financial transactions with AI-powered insights. Built with Angular 19 and TypeScript, it provides a responsive and intuitive user interface for managing personal finances.

### 🎯 Current Features

✅ **User Authentication** - Login, registration, password reset with JWT integration  
✅ **Transaction Management** - Create, view, edit, and delete transactions with rich UI  
✅ **Transaction Groups** - Organize transactions into categories with visual indicators  
✅ **Responsive Design** - Mobile-first approach with Angular Material components  
✅ **Real-time Validation** - Form validation with instant feedback  
✅ **Error Handling** - Comprehensive error management with user-friendly messages  
✅ **Loading States** - Interactive loading indicators for better UX

### 🔮 Upcoming Features

For detailed upcoming features and development progress, please check our [GitHub Issues](https://github.com/Sziszka90/FinanceApp.Frontend/issues).

## 🏗️ Architecture

### **Angular Project Structure**

```
📁 src/
  📁 app/                                    # Main application module
    📁 shared/                               # Shared components and utilities
      📁 error-modal/                        # Error handling modal
      📁 home/                               # Home page component
      📁 loader/                             # Loading spinner component
      📁 nav-bar/                            # Navigation bar
      📁 not-found/                          # 404 page component
      📁 validation-failed/                  # Validation error component
    📁 transaction-groups/                   # Transaction group features
      📁 create-transaction-group-modal/     # Create group modal
      📁 transaction-group/                  # Group display component
      📁 update-transaction-group-modal/     # Edit group modal
    📁 transactions/                         # Transaction management features
      📁 create-transaction-modal/           # Create transaction modal
      📁 transaction/                        # Transaction display component
      📁 update-transaction-modal/           # Edit transaction modal
    📁 user/                                 # User management features
      📁 forgot-password-modal/              # Password reset modal
      📁 logged-in/                          # Authenticated user component
      📁 login/                              # Login page
      📁 profile/                            # User profile management
      📁 registration/                       # User registration
      📁 resend-email-confirmation-modal/    # Email confirmation modal
      📁 reset-password/                     # Password reset page
  📁 assets/                                 # Static assets
    📁 pictures/                             # Icons and images
    📁 scss/                                 # SCSS styling
    📁 translations/                         # i18n translation files
  📁 environments/                           # Environment configurations
  📁 helpers/                                # Utility functions
  📁 models/                                 # TypeScript interfaces and DTOs
  📁 services/                               # Angular services for API communication
```

### **Key Frontend Patterns**

- **Component-Based Architecture** - Modular, reusable Angular components
- **Reactive Programming** - RxJS for handling async data streams
- **Service Layer** - Dedicated services for API communication and state management
- **Route Guards** - Authentication and authorization protection
- **Reactive Forms** - Angular reactive forms with custom validators
- **Error Boundary** - Centralized error handling and user notifications
- **Responsive Design** - Mobile-first CSS with Angular Flex Layout

## 🚀 Tech Stack

### **Frontend Framework**

- **Angular 19** - Latest Angular framework with standalone components
- **TypeScript** - Strong typing for better code quality and maintainability
- **Angular CLI** - Development tooling and build optimization
- **RxJS** - Reactive programming for async data handling
- **Angular Material** - Professional UI component library
- **Angular Flex Layout** - Responsive layout system

### **Styling & UI**

- **SCSS** - Enhanced CSS with variables, mixins, and nesting
- **Responsive Design** - Mobile-first approach with breakpoint management
- **Custom Theming** - Consistent design system across the application

### **State Management & Communication**

- **HTTP Client** - RESTful API communication
- **JWT Interceptor** - Automatic token handling
- **Error Interceptor** - Global error handling

## 🔧 Features Deep Dive

### **👤 User Interface & Authentication**

- **Login/Registration Forms** with reactive validation
- **Password Reset Flow** with step-by-step guidance
- **Profile Management** with editable user settings
- **Authentication Guards** protecting routes and components

### **💰 Transaction and Transaction Group Management UI**

- **Transaction Lists** with sorting, filtering
- **Create/Edit Modals** with rich form controls and validation
- **Bulk Operations** with selection and confirmation dialogs
- **CSV Import** - Bulk transaction import from CSV files
- **Visual Transaction** with color-coded categories

### **🎨 User Experience Features**

- **Responsive Navigation** with collapsible sidebar
- **Loading States** with skeleton screens and spinners
- **Error Handling** with toast notifications and modal dialogs
- **Form Validation** with real-time feedback and error messages

## 🚦 Getting Started

### **Prerequisites**

```bash
# Required software
Node.js 18+ (with npm)
Angular CLI 19+
Git
```

### **Frontend Setup**

```bash
# Clone the repository
git clone https://github.com/Sziszka90/FinanceApp.Frontend.git
cd FinanceApp.Frontend

# Install dependencies
npm install

# Start development server
ng serve

# Open browser at http://localhost:4200
```

### **Environment Configuration**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "https://localhost:5001/api",
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://your-api-domain.com/api",
};
```

## 🧪 Development & Testing

### **Development Commands**

```bash
# Start development server
ng serve

# Build for production
ng build --prod

# Run unit tests
ng test

# Run e2e tests
ng e2e

# Lint code
ng lint

# Generate component/service
ng generate component my-component
ng generate service my-service
```

### **Code Quality**

```bash
# Format code with Prettier
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🐳 Docker & Deployment

### **Docker Support**

```dockerfile
# Build and run with Docker
docker build -t financeapp-frontend .
docker run -p 80:80 financeapp-frontend
```

### **Production Build**

```bash
# Build for production
ng build --configuration=production

# Serve static files
# Built files will be in dist/ directory
```

### **CI/CD Pipeline**

**GitHub Actions** handles the complete CI/CD workflow:

```yaml
# Automated pipeline includes:
✅ Code quality checks and linting
✅ Unit test execution
✅ Build optimization and bundling
✅ Docker image creation
✅ Deployment to hosting platform
✅ Automated testing and health checks
```

**Deployment Flow:**

1. **Push to main** → Triggers GitHub Actions workflow
2. **Build & Test** → Runs automated test suite and linting
3. **Bundle** → Creates optimized production build
4. **Deploy** → Updates hosting platform with new version
5. **Verify** → Automated health checks ensure successful deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👤 Author

**Szilard Ferencz**  
🌐 [szilardferencz.dev](https://www.szilardferencz.dev)  
💼 [LinkedIn](https://www.linkedin.com/in/szilard-ferencz/)  
🐙 [GitHub](https://github.com/Sziszka90)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

⭐ **Star this repo if you find it helpful!** ⭐
