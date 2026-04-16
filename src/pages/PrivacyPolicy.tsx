import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-primary text-white p-4 flex items-center gap-3">
        <button onClick={() => setLocation("/")} data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Privacy Policy</h1>
      </div>

      <div className="p-4 space-y-6 text-sm text-muted-foreground max-w-2xl mx-auto pb-20">
        <p className="text-xs">Last updated: February 19, 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Introduction</h2>
          <p>
            AtoZDukaan ("we", "our", or "us") operates the atozdukaan.com website and mobile application.
            This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Information:</strong> Name, phone number, email address, and delivery address when you create an account or place an order.</li>
            <li><strong>Order Information:</strong> Details of products and services you order, delivery preferences, and payment information.</li>
            <li><strong>Device Information:</strong> Device type, operating system, browser type, and IP address for app functionality and security.</li>
            <li><strong>Usage Data:</strong> How you interact with our app, pages visited, and features used to improve our services.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and deliver your orders</li>
            <li>To create and manage your account</li>
            <li>To communicate order updates and delivery status</li>
            <li>To provide customer support</li>
            <li>To send promotional offers and updates (with your consent)</li>
            <li>To improve our products, services, and user experience</li>
            <li>To prevent fraud and ensure security</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Information Sharing</h2>
          <p>
            We do <strong>not</strong> sell, trade, or share your personal information with any third party.
            Your data is used only by us for order processing and delivery purposes.
          </p>
          <p>
            We only use your phone number and delivery address to deliver your order to you. This information
            is kept strictly confidential and is not shared with anyone outside of our delivery team.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information from unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Cookies & Local Storage</h2>
          <p>
            We use cookies and local storage to keep you logged in, remember your cart items, and improve your browsing experience.
            You can disable cookies in your browser settings, but some features may not work properly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>
              Request deletion of your account and data —{" "}
              <a href="/delete-account" className="text-primary underline font-medium" data-testid="link-delete-account">
                Delete My Account
              </a>
            </li>
            <li>Opt-out of promotional communications</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Third-Party Services</h2>
          <p>
            Our app may contain links to third-party websites or services. We are not responsible for the privacy
            practices of these external sites. We recommend reading their privacy policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13 years of age. We do not knowingly collect
            personal information from children under 13.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes
            through our app or by other means. Continued use of our services after changes means you accept the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <div className="bg-muted p-3 rounded-lg space-y-1">
            <p><strong>AtoZDukaan</strong></p>
            <p>Website: atozdukaan.com</p>
            <p>Phone: 9999878381</p>
          </div>
        </section>
      </div>
    </div>
  );
}
