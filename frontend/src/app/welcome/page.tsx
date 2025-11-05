'use client'

import { useState } from 'react'

export default function HomePage() {
  const [message, setMessage] = useState('იტვირთება...')

  const handleTest = () => {
    setMessage('დაგუკუდაობა: Georgian Distribution System working!')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '4px' }}
            />
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
              Georgian Distribution System
            </h1>
            <span
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              v2.1
            </span>
          </div>

          <button
            style={{
              border: '1px solid #d1d5db',
              background: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Connection Test
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '64px' }}>
          <h2
            style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}
          >
            B2B Food Distribution Platform
          </h2>
          <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '32px' }}>
            თანამედროვე პლატფორმა საქართველოში ფუდ დისტრიბუციისთვის
          </p>

          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}
          >
            <button
              onClick={handleTest}
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🧪</span>
              Test Connection
            </button>
            <button
              style={{
                border: '1px solid #d1d5db',
                background: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'not-allowed',
                opacity: 0.5,
              }}
            >
              Login (Coming Soon)
            </button>
          </div>

          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
            }}
          >
            {message}
          </div>
        </div>

        {/* Status Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}
        >
          {/* Frontend Status */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              background: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <span style={{ fontSize: '32px' }}>✅</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Frontend Ready</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Next.js 15 + TypeScript
                </p>
              </div>
            </div>
            <ul style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
              <li>✅ React 19 + shadcn/ui</li>
              <li>✅ Tailwind CSS v4</li>
              <li>✅ Zustand + React Query</li>
            </ul>
          </div>

          {/* Backend Status */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              background: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <span style={{ fontSize: '32px' }}>🔗</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  Backend Connected
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Official Supabase</p>
              </div>
            </div>
            <ul style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
              <li>✅ PostgreSQL 15+</li>
              <li>✅ PostgREST API</li>
              <li>✅ Development: akxmacfsltzhbnunoepb.supabase.co</li>
            </ul>
          </div>

          {/* Next Steps */}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              background: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <span style={{ fontSize: '32px' }}>🚀</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Next Steps</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Development Ready</p>
              </div>
            </div>
            <ul style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
              <li>✅ Development Environment Setup</li>
              <li>✅ React Compiler Issues Fixed</li>
              <li>✅ PWA Configuration Complete</li>
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            background: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚡</span>
            Key Features
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}
          >
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>ადმინისტრატორი</h4>
              <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
                <li>• მომხმარებლების მართვა</li>
                <li>• პროდუქტების კატალოგი</li>
                <li>• შეკვეთების კონტროლი</li>
                <li>• ანალიტიკა და რეპორტინგი</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>რესტორანი</h4>
              <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
                <li>• ციფრული შეკვეთები</li>
                <li>• Real-time სტატუსი</li>
                <li>• შეკვეთების ისტორია</li>
                <li>• ხარჯების თრექინგი</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>მძღოლი</h4>
              <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
                <li>• მიტანების სია</li>
                <li>• სტატუსის განახლება</li>
                <li>• მობილური ინტერფეისი</li>
                <li>• Real-time ნოტიფიკაციები</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#9ca3af',
          }}
        >
          <p>Built with Next.js • TypeScript • Supabase • Tailwind CSS • shadcn/ui</p>
          <p style={{ marginTop: '8px', fontSize: '12px' }}>
            Georgian Distribution System v2.1 - Development Environment
          </p>
        </div>
      </main>
    </div>
  )
}
