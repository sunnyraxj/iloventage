import { getStoreSettings } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PrivacyPolicyPage() {
    const settings = await getStoreSettings();
    const storeName = settings?.storeDetails?.name || 'our store';
    const storeEmail = settings?.storeDetails?.email || 'our contact email';
    const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <main className="flex-1 bg-secondary py-12 md:py-16">
            <div className="container mx-auto px-4">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-headline">Privacy Policy</CardTitle>
                        <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none mx-auto space-y-6">
                        <p>
                            This Privacy Policy describes how {storeName} ("we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from this website (the "Site").
                        </p>

                        <h2 className="text-2xl font-bold">1. Information We Collect</h2>
                        <p>We collect personal information you provide to us directly. This includes:</p>
                        <ul>
                            <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and password. If you sign up using Google, we collect your name, email, and profile picture as provided by Google.</li>
                            <li><strong>Order Information:</strong> When you place an order, we collect your shipping address (name, mobile number, physical address, city, state, pincode), and details about the products you purchase. For guest checkouts, we also collect an email address.</li>
                            <li><strong>Payment Information:</strong> We use Razorpay as our payment processor. While you make a payment, you are redirected to Razorpay's secure platform. We do not collect or store your credit card, debit card, or net banking details. We only receive a transaction confirmation, which includes a payment ID and order ID.</li>
                             <li><strong>Uploaded Content:</strong> If you are an administrator, we collect the images you upload for products, categories, and store settings. These are stored securely in Firebase Storage.</li>
                        </ul>

                        <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
                        <p>We use the information we collect for various purposes, including to:</p>
                        <ul>
                            <li>Process and fulfill your orders, including managing payments, shipping, and delivery.</li>
                            <li>Communicate with you about your order, account, and provide customer support.</li>
                            <li>Maintain and secure your account.</li>
                            <li>Improve and personalize our website, products, and services.</li>
                            <li>Prevent fraudulent transactions and protect the security of our Site.</li>
                        </ul>

                        <h2 className="text-2xl font-bold">3. How We Share Your Information</h2>
                        <p>We do not sell or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
                        <ul>
                            <li><strong>With Service Providers:</strong> We share information with our payment gateway, Razorpay, to process your payments.</li>
                            <li><strong>For Legal Reasons:</strong> We may disclose your information if we are required to do so by law or in response to a valid request from a law enforcement or government agency.</li>
                        </ul>

                        <h2 className="text-2xl font-bold">4. Data Storage and Security</h2>
                        <p>Your personal data, such as your user profile, orders, and addresses, is securely stored in our Firestore database, hosted by Google Firebase. Uploaded images are stored in Firebase Storage. We implement reasonable security measures to protect your information from unauthorized access, use, or disclosure.</p>

                        <h2 className="text-2xl font-bold">5. Your Rights</h2>
                        <p>You have the right to access and manage your personal information. You can:</p>
                        <ul>
                            <li>View and update your account information from your dashboard.</li>
                            <li>View your order history.</li>
                            <li>Add, edit, or delete your saved shipping addresses from your dashboard.</li>
                            <li>Request the deletion of your account by contacting us.</li>
                        </ul>

                        <h2 className="text-2xl font-bold">6. Cookies and Local Storage</h2>
                        <p>We use your browser's local storage to keep track of the items in your shopping cart. This allows your cart to persist even if you close the browser tab. We do not use tracking cookies for advertising purposes.</p>

                        <h2 className="text-2xl font-bold">7. Changes to This Privacy Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

                        <h2 className="text-2xl font-bold">8. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, you can contact us at: <a href={`mailto:${storeEmail}`} className="text-primary hover:underline">{storeEmail}</a>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}