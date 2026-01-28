class MessageParser {
  constructor(actionProvider, state) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi") || lowerCaseMessage.includes("hey")) {
      this.actionProvider.handleHello();
    } else if (lowerCaseMessage.includes("products") || lowerCaseMessage.includes("shop") || lowerCaseMessage.includes("materials") || lowerCaseMessage.includes("supplies")) {
      this.actionProvider.handleProducts();
    } else if (lowerCaseMessage.includes("contact") || lowerCaseMessage.includes("phone") || lowerCaseMessage.includes("email") || lowerCaseMessage.includes("reach")) {
      this.actionProvider.handleContact();
    } else if (lowerCaseMessage.includes("location") || lowerCaseMessage.includes("address") || lowerCaseMessage.includes("where")) {
      this.actionProvider.handleLocation();
    } else if (lowerCaseMessage.includes("quote") || lowerCaseMessage.includes("quotation") || lowerCaseMessage.includes("price")) {
      this.actionProvider.handleQuote();
    } else if (lowerCaseMessage.includes("services") || lowerCaseMessage.includes("support") || lowerCaseMessage.includes("help")) {
      this.actionProvider.handleServices();
    } else if (lowerCaseMessage.includes("delivery") || lowerCaseMessage.includes("shipping") || lowerCaseMessage.includes("transport")) {
      this.actionProvider.handleDelivery();
    } else if (lowerCaseMessage.includes("payment") || lowerCaseMessage.includes("pay") || lowerCaseMessage.includes("cost")) {
      this.actionProvider.handlePayment();
    } else if (lowerCaseMessage.includes("about") || lowerCaseMessage.includes("company") || lowerCaseMessage.includes("history")) {
      this.actionProvider.handleAbout();
    } else if (lowerCaseMessage.includes("inventory") || lowerCaseMessage.includes("stock") || lowerCaseMessage.includes("available")) {
      this.actionProvider.handleInventory();
    } else if (lowerCaseMessage.includes("account") || lowerCaseMessage.includes("login") || lowerCaseMessage.includes("register")) {
      this.actionProvider.handleAccount();
    } else {
      this.actionProvider.handleDefault();
    }
  }
}

export default MessageParser;