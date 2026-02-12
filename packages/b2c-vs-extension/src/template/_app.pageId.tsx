/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import { type LoaderFunctionArgs } from 'react-router';
import { currencyContext } from '@/lib/currency';
import { Region } from '@/components/region';
import { PageType } from '@/lib/decorators/page-type';
import { RegionDefinition } from '@/lib/decorators/region-definition';
import { fetchPageWithComponentData, type PageWithComponentData } from '@/lib/util/pageLoader';

@PageType({
    name: ${pageName},
    description: ${pageDescription},
    supportedAspectTypes: ${supportedAspectTypes},
})
@RegionDefinition([
    __REGIONS__
])
export class ${pageId}Metadata {}

export type ${pageId}Data = {
    page: Promise<PageWithComponentData>;
};

/**
 * Server-side loader function that fetches home page data.
 * This function runs on the server during SSR and prepares data for the home page.
 * @returns Promise that resolves to an object containing search result promise
 */
// eslint-disable-next-line react-refresh/only-export-components
export function loader(args: LoaderFunctionArgs): ${pageId}Data {
    const currency = args.context.get(currencyContext) as string;

    return {
        page: fetchPageWithComponentData(args, {
            pageId: '${pageId}',
        }),
    };
}

/**
 * Home page component that displays the home page content with granular Suspense boundaries.
 * Components within the page handle their own Suspense boundaries for progressive loading.
 * @returns JSX element representing the home page layout
 */
export default function ${pageId}({ loaderData }: { loaderData: ${pageId}Data }) {
    return (
        <div className="pb-16 -mt-8">
            {/* Header Banner Region - Region component handles its own Suspense internally */}
            <div>
                <Region
                    page={loaderData.page}
                    regionId="${regions[0].id}"
                    fallbackElement={
                        <div>Loading region ${regions[0].id}</div>
                    }
                    errorElement={
                        <div>Error loading region ${regions[0].id}</div>
                    }
                />
            </div>
        </div>
    );
}