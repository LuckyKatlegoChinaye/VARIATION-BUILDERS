import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatBWP } from '../utils/currency.js'

export default function Home() {
  const isLoggedIn = !!localStorage.getItem('token')
  const [carouselIndex, setCarouselIndex] = useState(0)

  const banners = [
    { title: 'Toners & Cartridges', subtitle: 'Premium Quality Printing Supplies', image: '/images/hp-05a-black-original-laserjet-toner-cartridge-500x500.jpeg' },
    { title: 'Office Furniture', subtitle: 'Ergonomic Solutions for Your Workspace', image: '/images/table1.png' },
    { title: 'Computer Electronics', subtitle: 'Latest Tech & Accessories', image: '/images/toner2.jpg' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % banners.length)
  }

  return (
    <div>
      {/* Carousel Banner (images only; full-bleed) */}
      <section
        role="region"
        aria-label="Homepage carousel"
        style={{ position: 'relative', background: 'transparent', color: '#fff', padding: '0', textAlign: 'center', overflow: 'hidden', minHeight: '420px', height: '50vh' }}
      >
        {/* Full-bleed carousel image (lazy) */}
        <img
          src={banners[carouselIndex].image}
          alt={banners[carouselIndex].title}
          loading="lazy"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1, zIndex: 0 }}
        />

        {/* Subtle overlay for text readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)', zIndex: 1 }} />

        {/* Text container */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2, padding: '80px 20px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '700', marginBottom: '12px', color: '#fff', textShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>{banners[carouselIndex].title}</h1>
          <p style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', marginBottom: '22px', color: '#fff', opacity: 0.95, textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>{banners[carouselIndex].subtitle}</p>
          <Link to="/shop-browse" style={{ display: 'inline-block', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '10px 22px', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}>
            Shop Now
          </Link>
        </div>

        {/* Controls */}
        <button type="button" aria-label="Previous slide" onClick={handlePrevCarousel} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', fontWeight: '700', zIndex: 3, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}>‹</button>
        <button type="button" aria-label="Next slide" onClick={handleNextCarousel} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', fontWeight: '700', zIndex: 3, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}>›</button>

        {/* Indicators */}
        <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 3 }}>
          {banners.map((_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCarouselIndex(i)}
              style={{ width: '12px', height: '12px', borderRadius: '50%', border: i === carouselIndex ? '2px solid #fff' : '2px solid rgba(255,255,255,0.6)', background: i === carouselIndex ? 'rgba(255,255,255,0.95)' : 'transparent', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '60px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '40px', color: '#1a1a1a', textAlign: 'center' }}>Shop by Category</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { name: 'Toners & Cartridges', count: 24, link: '/shop/toners' },
              { name: 'Office Furniture', count: 18, link: '/shop/furniture' },
              { name: 'Stationery', count: 35, link: '/shop/stationery' },
              { name: 'Computer Electronics', count: 15, link: '/shop/electronics' }
            ].map((cat, i) => (
              <Link key={i} to={cat.link} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', border: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>{cat.name}</h3>
                  <p style={{ color: '#666', fontSize: '13px' }}>{cat.count} Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>Featured Products</h2>
          <p style={{ color: '#666', marginBottom: '40px' }}>Premium selections from our catalog</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '40px' }}>
            {[
              { name: 'HP LaserJet Toner - Black', price: 89.99, image: '/images/hp-05a-black-original-laserjet-toner-cartridge-500x500.jpeg' },
              { name: 'Premium Toner Set', price: 159.99, image: '/images/toner4.png' },
              { name: 'Office Table - Cherry Wood', price: 299.99, image: '/images/table1.png' },
              { name: 'USB-C Hub - 7 Port', price: 64.99, image: '/images/toner2.jpg' }
            ].map((product, i) => (
              <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                <div style={{ background: '#e9e9e9', padding: '20px', textAlign: 'center', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#1a1a1a' }}>{product.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>{formatBWP(product.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/shop-browse" style={{ display: 'inline-block', background: '#1a1a1a', color: '#fff', padding: '12px 40px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>View All Products</Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '60px 20px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '50px', color: '#1a1a1a' }}>Why Choose Variation Builders?</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            {[
              { title: 'Premium Quality', desc: 'High-quality products sourced from trusted suppliers' },
              { title: 'Competitive Pricing', desc: 'Best prices with special discounts for bulk orders' },
              { title: 'Fast Delivery', desc: 'Quick processing and reliable shipping' },
              { title: 'Easy Quotations', desc: 'Get instant quotations for your bulk orders' },
              { title: 'Secure Transactions', desc: 'Safe and encrypted payment processing' },
              { title: '24/7 Support', desc: 'Dedicated customer service always available' }
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#1a1a1a' }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '13px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ background: '#1a1a1a', color: '#fff', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '16px', marginBottom: '30px', opacity: 0.9 }}>Browse our collection and find the products you need</p>
          <Link to="/shop" style={{ display: 'inline-block', background: '#ffc107', color: '#1a1a1a', padding: '12px 40px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1a1a1a', color: '#ffc107', padding: '40px 20px', textAlign: 'center', borderTop: '2px solid #ffc107' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ marginBottom: '10px' }}>© 2025 Variation Builders. All rights reserved.</p>
        </div>
      </footer>
      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/26776853770" target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: '#25D366',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        textDecoration: 'none'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </a>
    </div>
  )
}
