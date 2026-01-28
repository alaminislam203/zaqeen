export const generateNumericId = (length = 6) => {
    return Math.random().toString().substring(2, 2 + length);
  };
  
  export const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-4);
    const randomNum = Math.random().toString().substring(2, 6);
    return `ZQ-${timestamp}${randomNum}`;
  };