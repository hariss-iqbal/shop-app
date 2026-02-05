import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SeoService } from '../../../shared/services/seo.service';
import { PhoneService } from '../../../core/services/phone.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { environment } from '../../../../environments/environment';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

// interface Testimonial {
//   id: number;
//   name: string;
//   avatar: string;
//   rating: number;
//   text: string;
//   date: string;
// }

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    ProductCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private seoService = inject(SeoService);
  private phoneService = inject(PhoneService);
  private shopDetailsService = inject(ShopDetailsService);

  featuredPhones = signal<any[]>([]);
  featuredLoading = signal(true);

  whatsappNumber = computed(() => this.shopDetailsService.cachedDetails()?.whatsappNumber ?? environment.whatsapp.phoneNumber);
  shopName = computed(() => this.shopDetailsService.cachedDetails()?.shopName ?? environment.businessInfo.name);

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

  // testimonials: Testimonial[] = [
  //   { id: 1, name: 'Sarah Johnson', avatar: 'SJ', rating: 5, text: 'Excellent service!', date: '2 weeks ago' },
  //   { id: 2, name: 'Michael Chen', avatar: 'MC', rating: 5, text: 'Great prices and fast delivery.', date: '1 month ago' },
  //   { id: 3, name: 'Emily Davis', avatar: 'ED', rating: 4, text: 'Good selection of phones.', date: '3 weeks ago' },
  //   { id: 4, name: 'James Wilson', avatar: 'JW', rating: 5, text: 'Very trustworthy seller!', date: '1 week ago' },
  //   { id: 5, name: 'Amanda Garcia', avatar: 'AG', rating: 5, text: 'Exceptional after-sales support.', date: '2 months ago' }
  // ];

  // responsiveOptions = [
  //   { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
  //   { breakpoint: '991px', numVisible: 2, numScroll: 1 },
  //   { breakpoint: '767px', numVisible: 1, numScroll: 1 }
  // ];

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Spring Mobiles - Quality Mobile Phones at Great Prices',
      description: 'Discover quality new, used, and open box mobile phones at competitive prices. Fast delivery, quality assured, and excellent customer support.',
      url: '/'
    });
    this.loadFeaturedPhones();
  }

  async loadFeaturedPhones(): Promise<void> {
    try {
      const result = await this.phoneService.getCatalogPhones(
        { first: 0, rows: 8, sortField: 'created_at', sortOrder: -1 },
        { status: 'available' as any }
      );
      this.featuredPhones.set(result.data);
    } catch {
      // Silently fail - featured section just won't show
    } finally {
      this.featuredLoading.set(false);
    }
  }

}
