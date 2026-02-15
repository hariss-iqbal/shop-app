import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

interface ValueItem {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
}

// interface TeamMember {
//   name: string;
//   initials: string;
//   role: string;
//   bio: string;
// }

interface OpeningHoursItem {
  day: string;
  hours: string;
  closed: boolean;
}

@Component({
  selector: 'app-about',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private shopDetailsService: ShopDetailsService
  ) { }

  shopName = this.shopDetailsService.shopName;
  phoneDisplay = this.shopDetailsService.phoneDisplay;
  phoneLink = this.shopDetailsService.phoneLink;
  emailAddress = this.shopDetailsService.email;
  whatsappNumber = this.shopDetailsService.whatsappNumber;
  address = this.shopDetailsService.address;
  displayOpeningHours = computed(() => {
    const details = this.shopDetailsService.cachedDetails();
    if (details?.openingHours && details.openingHours.length > 0) {
      return details.openingHours.map(h => ({ day: h.day, hours: h.hours, closed: h.closed }));
    }
    return this.openingHours;
  });

  values: ValueItem[] = [
    {
      icon: 'pi pi-verified',
      iconClass: 'icon-quality',
      title: 'Quality Assured',
      description: 'Every phone is thoroughly inspected and tested before sale. We stand behind every device we sell.'
    },
    {
      icon: 'pi pi-shield',
      iconClass: 'icon-transparency',
      title: 'Transparent Pricing',
      description: 'No hidden fees or surprises. We provide detailed information about each device including condition and battery health.'
    },
    {
      icon: 'pi pi-users',
      iconClass: 'icon-service',
      title: 'Customer First',
      description: 'Our dedicated team is here to help you find the perfect phone with excellent after-sales support.'
    },
    {
      icon: 'pi pi-heart',
      iconClass: 'icon-trust',
      title: 'Built on Trust',
      description: 'Years of experience and thousands of satisfied customers make us your reliable phone partner.'
    }
  ];

  // teamMembers: TeamMember[] = [
  //   { name: 'Ahmed Hassan', initials: 'AH', role: 'Founder & CEO', bio: 'Started the shop with a vision...' },
  //   { name: 'Sarah Miller', initials: 'SM', role: 'Operations Manager', bio: 'Ensures smooth operations...' },
  //   { name: 'James Wilson', initials: 'JW', role: 'Technical Lead', bio: 'Heads our phone inspection team...' }
  // ];

  openingHours: OpeningHoursItem[] = [
    { day: 'Monday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Tuesday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Wednesday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Thursday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Friday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Saturday', hours: '9:00 AM - 6:00 PM', closed: false },
    { day: 'Sunday', hours: '', closed: true }
  ];

  ngOnInit(): void {
    const name = this.shopDetailsService.shopName() || 'our shop';
    this.seoService.updateMetaTags({
      title: 'About Us',
      description: `Learn about ${name} - your trusted source for new, used, and open box phones. Quality assured, transparent pricing, and exceptional customer service.`,
      url: '/about'
    });
  }
}
