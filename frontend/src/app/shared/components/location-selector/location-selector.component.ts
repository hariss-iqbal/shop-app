import { Component, OnInit, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { UserLocationAssignmentService } from '../../../core/services/user-location-assignment.service';
import { UserLocationDetail } from '../../../models/user-location-assignment.model';

/**
 * Location Selector Component
 * Dropdown for selecting the current store location
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, Select],
  templateUrl: './location-selector.component.html',
  styleUrls: ['./location-selector.component.scss']
})
export class LocationSelectorComponent implements OnInit {
  constructor(private userLocationAssignmentService: UserLocationAssignmentService) { }

  placeholder = input<string>('Select Location');
  showClear = input<boolean>(false);
  autoSelectDefault = input<boolean>(true);

  locationChange = output<string | null>();

  locations = computed<UserLocationDetail[]>(() => {
    return this.userLocationAssignmentService.userLocations();
  });

  selectedLocationId: string | null = null;

  ngOnInit(): void {
    this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    await this.userLocationAssignmentService.loadUserLocations();

    if (this.autoSelectDefault()) {
      const currentLocationId = this.userLocationAssignmentService.currentLocationId();
      if (currentLocationId) {
        this.selectedLocationId = currentLocationId;
      }
    }
  }

  onLocationChange(event: { value: string | null }): void {
    if (event.value) {
      this.userLocationAssignmentService.setCurrentLocation(event.value);
    }
    this.locationChange.emit(event.value);
  }
}
