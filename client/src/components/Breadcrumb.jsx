import React from 'react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: '20px', fontSize: '14px' }}>
      <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <span style={{ margin: '0 8px', color: '#666' }}>/</span>}
            {item.link ? (
              <Link to={item.link} style={{ color: '#007bff', textDecoration: 'none' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: '#666' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}