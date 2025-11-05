'use client'

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        fontFamily: 'system-ui',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Georgian Distribution System</h1>
        <p style={{ color: '#666' }}>✅ Next.js is running</p>
        <p style={{ color: '#666' }}>✅ React is working</p>
        <a
          href="/welcome"
          style={{
            display: 'inline-block',
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
          }}
        >
          Go to Welcome Page
        </a>
      </div>
    </div>
  )
}
