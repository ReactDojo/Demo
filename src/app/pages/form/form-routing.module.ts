import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ContractComponent } from '../../../app/Franchisee-Agreement/contract.component';
import { PromissaryContractsComponent } from '../../../app/Franchisee-Accounts/prommisary.component';
import { ContractsTableComponent } from '../../../app/Franchisee-Statement/Contracts-table.component';
import { ContractEditComponent } from '../../Franchisee-Agreement-edit/contract-edit.component';
import { MonthlyTransactionsComponent } from '../../Franchisee-History/monthly-transactions.component';
import { FranchiseeBillAdvancedFormComponent } from '../../../app/franchise-bill/franchisee-bill-advanced-form.component';
import { CustomerComponent  } from '../../customer/customer.component';
import { FranchiseeBillListComponent } from '../../../app/franchise-bill/franchisee-bill-list.component';
import { ElementsComponent } from './elements/elements.component';
import { ValidationComponent } from './validation/validation.component';
import { EditorComponent } from './editor/editor.component';
import { UploadsComponent } from './uploads/uploads.component';
import { WizardComponent } from './wizard/wizard.component';
import { MaskComponent } from './mask/mask.component';
import { AdvancedformComponent } from './advancedform/advancedform.component';
import { RepeaterComponent } from './repeater/repeater.component';
import { LayoutsComponent } from './layouts/layouts.component';
import { RoyaltyComponent } from 'src/app/Royalty/royalty.component';

//Cardinal Routing
const routes: Routes = [
    {
        path: 'customer',
        component: CustomerComponent
      },
      {
        path: 'Royalty',
        component: RoyaltyComponent
    },
    {
        path: 'franchisee-statement',
        component: ContractsTableComponent
    },
    {
        path: 'franchisee-history',
        component: MonthlyTransactionsComponent
    },
    {
        path: 'Franchisee-Agreement',
        component: ContractComponent
      },
      {
        path: 'Franchisee-Agreement-Edit/:vendorId/:contractId',
        component: ContractEditComponent
      },
      
      {
        path: 'promissary-contracts',
        component: PromissaryContractsComponent
      },
    
    {
        path: 'franchisee-statement/list',
        component: FranchiseeBillListComponent
      },
    {
        path: 'franchisee-statement',
        component: FranchiseeBillAdvancedFormComponent
    },
    {
        path: 'elements',
        component: ElementsComponent
    },
    {
        path: 'validation',
        component: ValidationComponent
    },
    {
        path: 'editor',
        component: EditorComponent
    },
    {
        path: 'uploads',
        component: UploadsComponent
    },
    {
        path: 'wizard',
        component: WizardComponent
    },
    {
        path: 'mask',
        component: MaskComponent
    },
    {
        path: 'advanced',
        component: AdvancedformComponent
    },
    {
        path: 'repeater',
        component: RepeaterComponent
    },
    {
        path: 'layouts',
        component: LayoutsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FormRoutingModule { }
