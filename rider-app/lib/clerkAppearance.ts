const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'iconButton' as const,
  },
  variables: {
    colorPrimary: '#b91c1c',
    colorBackground: '#0a0a0a',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorDanger: '#ef4444',
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
  elements: {
    card: {
      background: 'transparent',
      boxShadow: 'none',
      border: 'none',
      padding: 0,
    },
    rootBox: { width: '100%' },
    headerTitle: { color: '#ffffff' },
    headerSubtitle: { color: '#a1a1aa' },
    socialButtonsBlockButton: {
      background: '#18181b',
      border: '1px solid #3f3f46',
      color: '#ffffff',
    },
    socialButtonsBlockButtonText: { color: '#ffffff' },
    dividerLine: { background: '#27272a' },
    dividerText: { color: '#a1a1aa' },
    formFieldLabel: { color: '#ffffff' },
    formFieldInput: {
      background: '#18181b',
      border: '1px solid #3f3f46',
      color: '#ffffff',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
      color: '#ffffff',
      boxShadow: '0 0 20px rgba(185,28,28,0.4)',
    },
    footerActionLink: { color: '#fca5a5' },
    footerActionText: { color: '#a1a1aa' },
    identityPreviewText: { color: '#a1a1aa' },
    identityPreviewEditButton: { color: '#fca5a5' },
    formFieldAction: { color: '#fca5a5' },
    formFieldHintText: { color: '#a1a1aa' },
  },
};

export default clerkAppearance;
