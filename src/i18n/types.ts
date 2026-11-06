export type Dictionary = {
  appName: string;
  meta: {
    description: string;
  };
  nav: {
    home: string;
    expenses: string;
    accounts: string;
    categories: string;
    budget: string;
    users: string;
  };
  common: {
    edit: string;
    delete: string;
    deleting: string;
    saving: string;
  };
  auth: {
    title: string;
    subtitle: string;
    emailLabel: string;
    passwordLabel: string;
    signInButton: string;
    signingIn: string;
    orDivider: string;
    logout: string;
    googleButton: string;
    registerLink: string;
    forgotPasswordLink: string;
    signInLink: string;
    notices: {
      emailConfirmed: string;
      emailChanged: string;
      passwordReset: string;
    };
    errors: {
      invalidCredentials: string;
      generic: string;
      emailNotConfirmed: string;
      googleUnverified: string;
      googleFailed: string;
      googleNotConfigured: string;
    };
  };
  validation: {
    required: string;
    tooLong: string;
    invalidEmail: string;
    passwordLength: string;
    passwordMismatch: string;
  };
  register: {
    title: string;
    subtitle: string;
    nameLabel: string;
    lastNameLabel: string;
    confirmPasswordLabel: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    checkEmailTitle: string;
    checkEmailBody: string;
    emailNotSent: string;
  };
  resend: {
    emailLabel: string;
    button: string;
    sending: string;
    sent: string;
    emailNotSent: string;
  };
  confirmEmail: {
    confirmTitle: string;
    confirmBody: string;
    changeTitle: string;
    changeBody: string;
    button: string;
    confirming: string;
    invalidTitle: string;
    invalidBody: string;
    emailTaken: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    submit: string;
    submitting: string;
    sent: string;
    failed: string;
  };
  resetPassword: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    confirmLabel: string;
    submit: string;
    submitting: string;
    invalidTitle: string;
    invalidBody: string;
    requestNew: string;
  };
  completeProfile: {
    title: string;
    subtitle: string;
    submit: string;
  };
  users: {
    title: string;
    searchPlaceholder: string;
    searchButton: string;
    tableName: string;
    tableLastName: string;
    tableEmail: string;
    tableMethod: string;
    tableStatus: string;
    tableCreatedAt: string;
    method: { email: string; google: string; both: string };
    status: { pending: string; confirmed: string };
    emptyMessage: string;
    noResults: string;
    editTitle: string;
    save: string;
    cancel: string;
    close: string;
    emailChangePending: string;
    confirmDelete: (email: string) => string;
    errors: {
      notFound: string;
      emailTaken: string;
      lastAdmin: string;
      conflict: string;
      emailNotSent: string;
    };
  };
  emails: {
    linkFallback: string;
    ignore: string;
    confirm: { subject: string; intro: string; button: string };
    emailChange: { subject: string; intro: string; button: string };
    reset: { subject: string; intro: string; button: string };
    accountExists: { subject: string; intro: string; button: string };
    emailChangeNotice: { subject: string; intro: string };
  };
  expenseTypes: {
    needs: string;
    wants: string;
    savings: string;
  };
  home: {
    greeting: string;
    monthSelectLabel: string;
    spentInMonth: (month: string) => string;
    byCategoryTitle: string;
    byTypeTitle: string;
    topCategoriesTitle: string;
    monthRecordsTitle: string;
    viewAllLink: string;
    noExpensesMonth: string;
    otherCategory: string;
    expensesCard: { label: string; description: string; stat: (count: number) => string };
    accountsCard: { label: string; description: string; stat: (count: number) => string };
    categoriesCard: { label: string; description: string; stat: (count: number) => string };
  };
  budget: {
    title: string;
    description: string;
    saveSubmit: string;
    amountLabel: (typeLabel: string) => string;
    amountPlaceholder: string;
    errors: {
      invalidAmount: string;
      categoryRequired: string;
    };
    widgetTitle: string;
    setBudgetLink: string;
    noBudgetSet: string;
    of: string;
    remainingAmount: (amount: string) => string;
    overBy: (amount: string) => string;
    byTypeTitle: string;
    byCategoryTitle: string;
    categoryDescription: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    categoryAmountLabel: string;
    addCategoryButton: string;
    saveCategoryButton: string;
    noCategoriesAvailable: string;
    noCategoryBudgets: string;
    confirmRemoveCategoryBudget: (name: string) => string;
    categoryWidgetTitle: string;
  };
  accounts: {
    title: string;
    newButton: string;
    editTitle: string;
    newTitle: string;
    emptyMessage: string;
    tableName: string;
    tableType: string;
    tableCutoffDay: string;
    tablePaymentDay: string;
    createSubmit: string;
    editSubmit: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      typeLabel: string;
      typePlaceholder: string;
      cutoffDayLabel: string;
      cutoffDayPlaceholder: string;
      paymentDayLabel: string;
      paymentDayPlaceholder: string;
      creditOnlyHint: string;
    };
    confirmDelete: (name: string) => string;
    errors: {
      nameRequired: string;
      typeRequired: string;
      hasExpenses: string;
      nameTaken: string;
      invalidCutoffDay: string;
      invalidPaymentDay: string;
    };
  };
  categories: {
    title: string;
    newButton: string;
    editTitle: string;
    newTitle: string;
    emptyMessage: string;
    tableName: string;
    createSubmit: string;
    editSubmit: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
    };
    confirmDelete: (name: string) => string;
    errors: {
      nameRequired: string;
      hasExpenses: string;
      nameTaken: string;
    };
  };
  expenses: {
    title: string;
    newButton: string;
    editTitle: string;
    newTitle: string;
    emptyMessage: string;
    tableDate: string;
    tableDescription: string;
    tableAccount: string;
    tableCategory: string;
    tableType: string;
    tableAmount: string;
    createSubmit: string;
    editSubmit: string;
    needsAccount: string;
    createAccountLink: string;
    noCategory: string;
    noType: string;
    noResults: string;
    msiBadge: string;
    filters: {
      searchLabel: string;
      searchPlaceholder: string;
      fromLabel: string;
      toLabel: string;
      apply: string;
      clear: string;
    };
    form: {
      descriptionLabel: string;
      descriptionPlaceholder: string;
      notesLabel: string;
      notesPlaceholder: string;
      amountLabel: string;
      amountPlaceholder: string;
      dateLabel: string;
      accountLabel: string;
      accountPlaceholder: string;
      categoryLabel: string;
      typeLabel: string;
      typePlaceholder: string;
      msiLabel: string;
      msiMonthsLabel: string;
      msiHint: string;
    };
    confirmDelete: (description: string) => string;
    errors: {
      descriptionRequired: string;
      accountRequired: string;
      invalidAmount: string;
      invalidDate: string;
      typeRequired: string;
      invalidMsiMonths: string;
      msiRequiresCutoffDay: string;
      msiInstallmentLocked: string;
    };
  };
};
