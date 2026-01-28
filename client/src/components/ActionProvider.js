class ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  handleHello = () => {
    const message = this.createChatBotMessage("Hello! Welcome to Variation Builders, your trusted partner for quality office supplies and electronics in Botswana. How can I assist you today?", {
      widget: "options",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleProducts = () => {
    const message = this.createChatBotMessage("At Variation Builders, we offer a comprehensive range of high-quality office supplies including:\n\n• Toners & Cartridges: Premium quality printing supplies for all major brands\n• Office Furniture: Ergonomic chairs, desks, and storage solutions\n• Stationery: Pens, paper, notebooks, and office essentials\n• Computer Electronics: Laptops, monitors, accessories, and peripherals\n\nAll products are sourced from reputable manufacturers to ensure durability and reliability for your office needs. Browse our Shop page for the full catalog!", {
      widget: "shopLink",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleContact = () => {
    const message = this.createChatBotMessage("We're here to help! Reach out to our expert team through multiple channels:\n\n• Phone: +267 3111272 / 3930013\n• Email: info@vb.co.bw\n• WhatsApp: +267 76853770 (for immediate assistance)\n• Location: BBS Mall, B/Hurst Industrial, Gaborone\n\nOur customer service team is available Monday to Friday, 8 AM to 5 PM.", {
      widget: "contactOptions",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleLocation = () => {
    const message = this.createChatBotMessage("Variation Builders is conveniently located at BBS Mall, B/Hurst Industrial in the heart of Gaborone, Botswana. Our strategic location makes it easy for contractors, builders, and homeowners to access our extensive inventory of building materials. We also offer delivery services throughout Botswana.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleQuote = () => {
    const message = this.createChatBotMessage("Getting a quotation is simple! Browse our comprehensive product catalog, add items to your cart, and request a customized quotation. Our system provides instant pricing, and our team can offer volume discounts for bulk orders. You'll need to create an account or log in to access the quotation feature.", {
      widget: "loginLink",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleServices = () => {
    const message = this.createChatBotMessage("Beyond supplying office products, Variation Builders offers comprehensive office support services:\n\n• Office setup consultation and planning\n• Product delivery and logistics\n• Technical advice from our experienced team\n• Custom ordering for specialized requirements\n• After-sales support and warranty services\n\nLet us help you equip your office efficiently!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleDelivery = () => {
    const message = this.createChatBotMessage("We provide reliable delivery services throughout Botswana. Our fleet ensures timely and safe transportation of your building materials. Delivery charges are calculated based on location and order value. For large orders, we offer scheduled deliveries to minimize disruption to your project timeline.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handlePayment = () => {
    const message = this.createChatBotMessage("We offer flexible payment options to suit your needs:\n\n• Cash payments at our showroom\n• Bank transfers (preferred for large orders)\n• Credit terms available for approved accounts\n• Mobile money payments\n• Online payments for registered customers\n\nAll transactions are secure and receipts are provided for your records.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleAbout = () => {
    const message = this.createChatBotMessage("Variation Builders has been a leading supplier of office supplies and electronics in Botswana for over a decade. Our commitment to quality, reliability, and customer satisfaction has made us the preferred choice for businesses, government offices, schools, and individuals alike. We pride ourselves on:\n\n• Extensive inventory of office essentials\n• Competitive pricing with volume discounts\n• Exceptional customer service\n• Convenient location at BBS Mall, B/Hurst Industrial\n• Reliable delivery services throughout Botswana\n• Expert technical advice and support\n\nVisit us to experience the difference!");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleInventory = () => {
    const message = this.createChatBotMessage("Our inventory management system ensures real-time stock availability. Check our online catalog to see current stock levels of toners, furniture, stationery, and electronics, or visit our showroom to browse our extensive range. We maintain minimum stock levels for essential items and can arrange special orders for items not in stock.");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleAccount = () => {
    const message = this.createChatBotMessage("Creating an account with Variation Builders unlocks additional features:\n\n• Save favorite products\n• Track order history\n• Request quotations online\n• Access exclusive pricing\n• Receive project updates\n\nRegistration is quick and free!", {
      widget: "loginLink",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  handleDefault = () => {
    const message = this.createChatBotMessage("I'm here to help with any questions about Variation Builders! Whether you need information about our products, services, pricing, or anything else related to your office supply needs, feel free to ask. For immediate assistance, please WhatsApp us at +267 76853770 or call +267 3111272.", {
      widget: "whatsappLink",
    });
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };
}

export default ActionProvider;