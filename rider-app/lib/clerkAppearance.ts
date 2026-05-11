import { dark } from '@clerk/themes';

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#b91c1c',
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
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
      boxShadow: '0 0 20px rgba(185,28,28,0.4)',
    },
    footerActionLink: { color: '#fca5a5' },
    identityPreviewEditButton: { color: '#fca5a5' },
    formFieldAction: { color: '#fca5a5' },
  },
};

export default clerkAppearance;
