'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

// Mock data for the demo
// In a real app, this data would come from your AI matching function
const mockRecommendations = [
  {
    id: 1,
    title: 'Beginner Yoga Class',
    category: 'Fitness',
    provider: 'Sarah K.',
    match: 'Based on your interest in "Wellness"',
  },
  {
    id: 2,
    title: 'Data Science Tutoring',
    category: 'Tech',
    provider: 'David L.',
    match: 'Based on your skill in "Python"',
  },
  {
    id: 3,
    title: 'Spanish Conversation',
    category: 'Language',
    provider: 'Maria G.',
    match: 'Based on your goal to "Travel"',
  },
  {
    id: 4,
    title: 'Local Community Garden',
    category: 'Community',
    provider: 'Green Thumbs',
    match: 'Based on your location',
  },
];

export function AiRecommendations() {
  return (
    <div className="w-full max-w-6xl p-4 mx-auto my-8">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-emerald-500" />
        <h2 className="text-2xl font-semibold tracking-tight">
          AI-Powered Recommendations for You
        </h2>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-4 pb-4">
          {mockRecommendations.map((service) => (
            // We use an <a> tag here for demo purposes, 
            // but you'd use a <Link> to the actual service page.
            <a href="#" key={service.id} className="no-underline">
              <Card className="w-[300px] hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                  <CardDescription>with {service.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700">{service.match}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

