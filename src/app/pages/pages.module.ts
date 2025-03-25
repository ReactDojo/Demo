import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TabsModule } from 'ngx-bootstrap/tabs';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { AlertModule } from 'ngx-bootstrap/alert';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SimplebarAngularModule } from 'simplebar-angular';
import { LightboxModule } from 'ngx-lightbox';

// Emoji Picker
import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { PagesRoutingModule } from './pages-routing.module';

import { DashboardsModule } from './dashboards/dashboards.module';
import { EmailModule } from './email/email.module';
import { ContactsModule } from './contacts/contacts.module';
import { UtilityModule } from './utility/utility.module';
import { UiModule } from './ui/ui.module';
import { TablesModule } from './tables/tables.module';
import { CalendarComponent } from './calendar/calendar.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

@NgModule(
        {
                declarations: [],
                imports: [CommonModule,
                        FormsModule,
                        BsDropdownModule.forRoot(),
                        ModalModule.forRoot(),
                        PagesRoutingModule,
                        NgApexchartsModule,
                        ReactiveFormsModule,
                        DashboardsModule,
                        EmailModule,
                        ContactsModule,
                        UtilityModule,
                        UiModule,
                        TablesModule,
                        FullCalendarModule,
                        TabsModule.forRoot(),
                        TooltipModule.forRoot(),
                        CollapseModule.forRoot(),
                        AlertModule.forRoot(),
                        SimplebarAngularModule,
                        LightboxModule,
                        PickerModule],
                providers: [provideHttpClient(withInterceptorsFromDi())]
        })
export class PagesModule { }
