/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client';

import {useTranslation} from 'react-i18next';
import {useBasket} from '@/providers/basket';
import {useCurrency} from '@/providers/currency';
import {formatCurrency} from '@/lib/currency';

/**
 * Avalara Tax Breakdown Component
 *
 * This component replaces the default tax line item in the order summary
 * with separate state tax and federal tax line items.
 *
 * Note: This is an example implementation. In a real scenario, you would
 * integrate with Avalara API to get the actual tax breakdown. For this
 * example, we use a simple 60/40 split (60% state, 40% federal).
 */
export default function TaxBreakdown() {
  const {t, i18n} = useTranslation('cart');
  const currency = useCurrency();
  const basket = useBasket();

  // If no basket, don't render anything
  if (!basket) {
    return null;
  }

  const taxTotal = basket.taxTotal;

  // Handle cases where tax is not available or is TBD
  if (typeof taxTotal !== 'number' || taxTotal < 0) {
    return (
      <div className="flex justify-between items-center">
        <span>{t('summary.tax')}</span>
        <span className="text-muted-foreground">{t('summary.taxTbd')}</span>
      </div>
    );
  }

  // Example tax breakdown: 60% state, 40% federal
  // In a real implementation, this would come from Avalara API
  const stateTax = taxTotal * 0.6;
  const federalTax = taxTotal * 0.4;

  return (
    <>
      {/* State Tax */}
      <div className="flex justify-between items-center">
        <span>State Tax</span>
        <span>{formatCurrency(stateTax, i18n.language, currency)}</span>
      </div>
      {/* Federal Tax */}
      <div className="flex justify-between items-center">
        <span>Federal Tax</span>
        <span>{formatCurrency(federalTax, i18n.language, currency)}</span>
      </div>
    </>
  );
}
