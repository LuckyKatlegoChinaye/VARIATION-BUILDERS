import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: "Variation Builders Assistant",
  initialMessages: [
    createChatBotMessage("Welcome to Variation Builders! I'm your AI assistant, here to help you with all your office supply and electronics needs. How can I assist you today?", {
      widget: "options",
    }),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: "#ffc107",
    },
    chatButton: {
      backgroundColor: "#ffc107",
    },
  },
  customComponents: {
    chatButton: () => (
      <button type="button" style={{ position: 'fixed', bottom: '90px', right: '20px', background: '#ffc107', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 1001, fontSize: '24px' }}>
        💬
      </button>
    ),
  },
  widgets: [
    {
      widgetName: "options",
      widgetFunc: (props) => (
        <div>
          {[
            { text: "Tell me about your products", handler: () => props.actionProvider.handleProducts() },
            { text: "How can I contact you?", handler: () => props.actionProvider.handleContact() },
            { text: "Where are you located?", handler: () => props.actionProvider.handleLocation() },
            { text: "How do I get a quote?", handler: () => props.actionProvider.handleQuote() },
            { text: "What services do you offer?", handler: () => props.actionProvider.handleServices() },
            { text: "Delivery information", handler: () => props.actionProvider.handleDelivery() },
            { text: "Payment options", handler: () => props.actionProvider.handlePayment() },
            { text: "About the company", handler: () => props.actionProvider.handleAbout() },
            { text: "Check inventory/stock", handler: () => props.actionProvider.handleInventory() },
            { text: "Account registration", handler: () => props.actionProvider.handleAccount() },
          ].map((option, index) => (
            <button
              type="button"
              key={index}
              onClick={option.handler}
              style={{
                display: 'block',
                margin: '5px 0',
                padding: '8px 12px',
                background: '#e9ecef',
                color: '#495057',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {option.text}
            </button>
          ))}
        </div>
      ),
    },
    {
      widgetName: "shopLink",
      widgetFunc: (_props) => (
        <button
          onClick={() => globalThis.location.href = '/shop'}
          style={{
            padding: '8px 12px',
            background: '#ffc107',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '5px'
          }}
        >
          Go to Shop
        </button>
      ),
    },
    {
      widgetName: "loginLink",
      widgetFunc: (_props) => (
        <button
          onClick={() => globalThis.location.href = '/login'}
          style={{
            padding: '8px 12px',
            background: '#ffc107',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '5px'
          }}
        >
          Login/Register
        </button>
      ),
    },
    {
      widgetName: "whatsappLink",
      widgetFunc: (_props) => (
        <a
          href="https://wa.me/26776853770"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 12px',
            background: '#25d366',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            marginTop: '5px'
          }}
        >
          WhatsApp Us
        </a>
      ),
    },
    {
      widgetName: "contactOptions",
      widgetFunc: (_props) => (
        <div>
          <a
            href="tel:+2673111272"
            style={{
              display: 'block',
              margin: '5px 0',
              padding: '8px 12px',
              background: '#007bff',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            Call +267 3111272
          </a>
          <a
            href="https://wa.me/26776853770"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              margin: '5px 0',
              padding: '8px 12px',
              background: '#25d366',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            WhatsApp
          </a>
        </div>
      ),
    },
  ],
};

export default config;