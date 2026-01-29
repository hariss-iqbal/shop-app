import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { CarouselModule } from 'primeng/carousel';
import { SeoService } from '../../../shared/services/seo.service';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    RatingModule,
    FormsModule,
    CarouselModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private seoService = inject(SeoService);

  features: FeatureItem[] = [
    {
      icon: 'pi pi-truck',
      title: 'Express Delivery',
      description: 'Fast and reliable delivery to your doorstep. Same-day delivery available in select areas.'
    },
    {
      icon: 'pi pi-wallet',
      title: 'Best Prices',
      description: 'Competitive pricing on all devices. We match prices to give you the best deals.'
    },
    {
      icon: 'pi pi-verified',
      title: 'Quality Assured',
      description: 'Every phone is thoroughly tested and inspected before sale. 30-day warranty included.'
    },
    {
      icon: 'pi pi-headphones',
      title: '24/7 Support',
      description: 'Our customer support team is always ready to help you with any questions or concerns.'
    }
  ];

  testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      rating: 5,
      text: 'Excellent service! I purchased a refurbished iPhone and it works like new. The team was very helpful in answering all my questions.',
      date: '2 weeks ago'
    },
    {
      id: 2,
      name: 'Michael Chen',
      avatar: 'MC',
      rating: 5,
      text: 'Great prices and fast delivery. I was hesitant to buy a used phone, but the quality exceeded my expectations. Highly recommend!',
      date: '1 month ago'
    },
    {
      id: 3,
      name: 'Emily Davis',
      avatar: 'ED',
      rating: 4,
      text: 'Good selection of phones at competitive prices. The website is easy to navigate and the checkout process was smooth.',
      date: '3 weeks ago'
    },
    {
      id: 4,
      name: 'James Wilson',
      avatar: 'JW',
      rating: 5,
      text: 'I bought a Samsung Galaxy for my daughter. The battery health was exactly as described. Very trustworthy seller!',
      date: '1 week ago'
    },
    {
      id: 5,
      name: 'Amanda Garcia',
      avatar: 'AG',
      rating: 5,
      text: 'Phone Shop has become my go-to place for mobile devices. Their after-sales support is exceptional.',
      date: '2 months ago'
    }
  ];

  responsiveOptions = [
    {
      breakpoint: '1199px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Phone Shop - Quality Mobile Phones at Great Prices',
      description: 'Discover quality new, used, and refurbished mobile phones at competitive prices. Fast delivery, quality assured, and excellent customer support.',
      url: '/'
    });
  }
}
