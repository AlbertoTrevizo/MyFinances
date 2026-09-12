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
  };
  common: {
    edit: string;
    delete: string;
    deleting: string;
    saving: string;
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
  accounts: {
    title: string;
    newButton: string;
    editTitle: string;
    newTitle: string;
    emptyMessage: string;
    tableName: string;
    tableType: string;
    createSubmit: string;
    editSubmit: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      typeLabel: string;
      typePlaceholder: string;
    };
    confirmDelete: (name: string) => string;
    errors: {
      nameRequired: string;
      typeRequired: string;
      hasExpenses: string;
      nameTaken: string;
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
      amountLabel: string;
      amountPlaceholder: string;
      dateLabel: string;
      accountLabel: string;
      accountPlaceholder: string;
      categoryLabel: string;
      typeLabel: string;
      typePlaceholder: string;
    };
    confirmDelete: (description: string) => string;
    errors: {
      descriptionRequired: string;
      accountRequired: string;
      invalidAmount: string;
      invalidDate: string;
      typeRequired: string;
    };
  };
};
