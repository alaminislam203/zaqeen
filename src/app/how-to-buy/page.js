const HowToBuyPage = () => {
  return (
    <div className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-black text-center mb-4 tracking-wide">How to Buy</h1>
        <p className="text-center text-gray-500 mb-16">Follow these simple steps to get your hands on our exclusive apparel.</p>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex items-start gap-8">
            <div className="text-5xl font-black text-gray-100">01</div>
            <div className="pt-2">
              <h3 className="text-xl font-bold mb-2">Browse & Discover</h3>
              <p className="text-gray-600 leading-relaxed">
                Explore our curated collections of streetwear, t-shirts, and hoodies. Use the navigation menu to visit the Shop, check out New Arrivals, or see our Best Sellers. Click on any product you like to see more details.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-8">
            <div className="text-5xl font-black text-gray-100">02</div>
            <div className="pt-2">
              <h3 className="text-xl font-bold mb-2">Add to Bag</h3>
              <p className="text-gray-600 leading-relaxed">
                On the product page, select your desired size and color, then click the "Add to Bag" button. The item will be added to your shopping bag, and you can continue shopping or proceed to checkout.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-8">
            <div className="text-5xl font-black text-gray-100">03</div>
            <div className="pt-2">
              <h3 className="text-xl font-bold mb-2">Review Your Bag</h3>
              <p className="text-gray-600 leading-relaxed">
                Click on the shopping bag icon at the top of the page to review your selected items. Here, you can adjust quantities or remove items before moving to the next step.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-8">
            <div className="text-5xl font-black text-gray-100">04</div>
            <div className="pt-2">
              <h3 className="text-xl font-bold mb-2">Proceed to Checkout</h3>
              <p className="text-gray-600 leading-relaxed">
                When you're ready, click "Checkout." You'll be asked to provide your shipping address, contact information, and choose a delivery method. Ensure all details are correct to avoid delays.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-8">
            <div className="text-5xl font-black text-gray-100">05</div>
            <div className="pt-2">
              <h3 className="text-xl font-bold mb-2">Payment & Confirmation</h3>
              <p className="text-gray-600 leading-relaxed">
                Select your preferred payment method and complete the transaction. Once your order is successfully placed, you will receive a confirmation email with your order details and a tracking number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToBuyPage;
