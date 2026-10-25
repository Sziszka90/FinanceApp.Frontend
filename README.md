# 💼 Finance App - Frontend

## 📦 A sophisticated personal finance management platform with intelligent transaction processing

This is the frontend application for a personal finance management platform that helps users track, categorize, and analyze their financial transactions with AI-powered insights. It features an integrated chat with AI functionalities, allowing users to query and receive information about their own financial data. Built with Angular 22 and TypeScript, it provides a responsive and intuitive user interface for managing personal finances.

## 🎯 Current Features

✅ **User**

- Login, registration, password reset with JWT integration using **HTTP Only Cookies** for secure authentication and email confirmation
- User profile where users can set their preferred currency

✅ **Transactions**

- Create, read, update, and delete transactions
- Search and filter transactions by name, date, type, and transaction group, with cursor-based pagination
- Import bank statement PDFs and follow queued, processing, completed, and failed status updates
- Receive import updates through SignalR, with status polling when returning to the page; imports with no completion response are marked failed by the client after 10 minutes

✅ **Transaction Groups**

- Create, read, update, and delete transaction groups
- Organize transactions into categories with visual indicators

✅ **Spending Analytics**

- View spending or income by transaction group over a selected date range
- Switch between pie and bar chart visualizations

✅ **Profile Settings**

- Manage merchant-based transaction categorization rules
- Save and select bank-specific instructions for PDF statement imports

✅ **Responsive Design**

- Fully adaptive layout for seamless experience on any device

✅ **Real-time Validation**

- Form validation with instant feedback

✅ **Error Handling**

- Comprehensive error management with user-friendly messages

✅ **Loading States**

- Interactive loading indicators for better UX

✅ **Cloud Wake-Up Loader**

- Displays a loader while the cloud backend service initializes, ensuring users are informed during startup delays

✅ **AI-Powered Chat**

- Integrated chat assistant that provides personalized insights and answers based on your financial data

## 🔮 Upcoming Features

For detailed upcoming features and development progress, please check our [GitHub Issues](https://github.com/Sziszka90/FinanceApp.Frontend/issues).

## 🏗️ Architecture

### **Angular Project Structure**

```
📁 src/
  📁 app/                                    # Main application module
    📁 shared/                               # Shared components and utilities
      📁 chat-bubble/                        # AI chat bubble
      📁 error-modal/                        # Error handling modal
      📁 home/                               # Home page component
      📁 loader/                             # Loading spinner component
      📁 nav-bar/                            # Navigation bar
      📁 not-found/                          # 404 page component
      📁 validation-failed/                  # Validation error component
      📁 wakeup-loader/                      # Loader to indicate the wake up of backend service
    📁 transaction-groups/                   # Transaction group features
      📁 create-transaction-group-modal/     # Create group modal
      📁 transaction-group/                  # Group display component
      📁 update-transaction-group-modal/     # Edit group modal
    📁 transactions/                         # Transaction management features
      📁 create-transaction-modal/           # Create transaction modal
      📁 transaction/                        # Transaction display component
      📁 update-transaction-modal/           # Edit transaction modal
    📁 spending-analytics/                   # Spending and income charts by group
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
  📁 interceptors/                           # Interceptors
  📁 models/                                 # TypeScript interfaces and DTOs
  📁 services/                               # Angular services for API communication
  📁 testing/                                # Unit tests
```

### **Key Frontend Patterns**

- **Component-Based Architecture** - Modular, reusable Angular components
- **Reactive and Async Programming** - Reactive and async programming with RxJS and async/await for handling data streams
- **Service Layer** - Dedicated services for API communication and state management
- **Route Guards** - Authentication and authorization protection
- **Reactive Forms** - Angular reactive forms with custom validators
- **Error Boundary** - Centralized error handling and user notifications
- **Base Component Class** - Base component class for centralized form and error handling
- **Responsive Design** - Mobile-first CSS with Angular Flex Layout

## 💻 Tech Stack

### **Frontend Framework**

- **Angular 22** - Angular framework with standalone components
- **TypeScript** - Strong typing for better code quality and maintainability
- **Angular CLI** - Development tooling and build optimization
- **RxJS** - Reactive programming for async data handling
- **Angular Material** - Professional UI component library
- **Chart.js** - Spending analytics charts

### **Styling & UI**

- **SCSS** - Enhanced CSS with variables, mixins, and nesting
- **Responsive Design** - Mobile-first approach with breakpoint management
- **Custom Theming** - Consistent design system across the application


## 🧪 Testing and Quality

Unit tests, coverage reports, and lint checks run in the CI/CD pipeline. Coverage varies by build; the generated report is the source of the current coverage figures.

## 🚀 Deployment

### **Azure Container Apps**

The application is deployed as **containerized microservices** on **Azure Container Apps** using GitHub Actions.

**Deployment Flow:**

1. **Push to main** → Triggers GitHub Actions workflow
2. **Build & Test** → Runs automated test suite and linting
3. **Bundle** → Creates production build
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
