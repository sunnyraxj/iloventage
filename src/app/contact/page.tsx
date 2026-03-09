import { getStoreSettings } from '@/lib/data';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8"><title>WhatsApp</title><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);


export default async function ContactPage() {
    const settings = await getStoreSettings();
    const details = settings?.storeDetails;
    const mapQuery = encodeURIComponent(`${details?.address}, ${details?.city}, ${details?.state} ${details?.pincode}`);
    const googleMapsUrl = `https://www.google.com/maps?q=${mapQuery}`;

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-secondary py-12 md:py-20">
                <div className="container mx-auto px-4">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader className="text-center">
                            <CardTitle className="text-4xl font-headline">Contact Us</CardTitle>
                            <p className="text-muted-foreground">We'd love to hear from you!</p>
                        </CardHeader>
                        <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Get in Touch</h2>
                                {details?.address && (
                                <div className="flex items-start gap-4">
                                    <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold">Our Location</h3>
                                        <p className="text-muted-foreground">{details.address}</p>
                                        <p className="text-muted-foreground">{details.city}, {details.state} {details.pincode}</p>
                                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                                            Get Directions
                                        </a>
                                    </div>
                                </div>
                                )}
                                {details?.email && (
                                <div className="flex items-start gap-4">
                                    <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold">Email Us</h3>
                                        <a href={`mailto:${details.email}`} className="text-muted-foreground hover:text-primary break-all">{details.email}</a>
                                    </div>
                                </div>
                                )}
                                {details?.phone && (
                                <div className="flex items-start gap-4">
                                    <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold">Call Us</h3>
                                        <a href={`tel:${details.phone}`} className="text-muted-foreground hover:text-primary">{details.phone}</a>
                                        {details.phone2 && <a href={`tel:${details.phone2}`} className="text-muted-foreground hover:text-primary block mt-1">{details.phone2}</a>}
                                    </div>
                                </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Follow Us</h2>
                                <p className="text-muted-foreground">Stay connected with us on social media for the latest updates and offers.</p>
                                <div className="flex space-x-4">
                                    {details?.instagramUrl && (
                                        <Link href={details.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                            <Instagram className="h-8 w-8" />
                                        </Link>
                                    )}
                                     {details?.whatsappGroupUrl && (
                                        <Link href={details.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary fill-current">
                                            <WhatsAppIcon />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
