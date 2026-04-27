'use client';

import { Heart, Gift, Users, Coffee, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const donationTiers = [
  {
    icon: Coffee,
    name: 'Supporter',
    amount: 'Rp 10.000',
    description: 'Dukung turnamen dan dapatkan badge khusus',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Heart,
    name: 'Super Fan',
    amount: 'Rp 50.000',
    description: 'Badge premium + akses VIP chat',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: Gift,
    name: 'Sponsor',
    amount: 'Rp 100.000',
    description: 'Logo di banner + shoutout spesial',
    color: 'from-purple-500 to-indigo-500'
  }
];

export function Sawer() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-background dark:via-background dark:to-background" />
        <img
          src="/bg-section.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.02] dark:opacity-[0.04]"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="w-12 h-12 mx-auto mb-4 text-pink-500 fill-pink-500" />
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            SAWER & <span className="text-pink-500">DONASI</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Dukung turnamen esports favoritmu dan bantu komunitas gaming Indonesia berkembang!
          </p>
        </div>

        {/* Donation Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {donationTiers.map((tier) => (
            <Card
              key={tier.name}
              className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-pink-500/50 transition-all group"
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <tier.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  {tier.name}
                </CardTitle>
                <p className="text-2xl font-bold text-pink-500">{tier.amount}</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">{tier.description}</p>
                <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500">
                  <Heart className="w-4 h-4 mr-2" />
                  Donate Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Donations */}
        <Card className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Rp 15.750.000</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-500">347</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Donatur</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">12</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sponsors</p>
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
