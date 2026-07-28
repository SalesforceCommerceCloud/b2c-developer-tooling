/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export interface IsmlTagSnippet {
  prefix: string;
  body: string[];
  description: string;
}

export const TAG_SNIPPETS: IsmlTagSnippet[] = [
  {
    prefix: 'isif',
    body: ['<isif condition="${1:condition}">', '\t$0', '</isif>'],
    description: 'ISML <isif> conditional block',
  },
  {
    prefix: 'isifelse',
    body: ['<isif condition="${1:condition}">', '\t$2', '<iselse/>', '\t$0', '</isif>'],
    description: 'ISML <isif>/<iselse> conditional block',
  },
  {
    prefix: 'isifelseif',
    body: [
      '<isif condition="${1:firstCondition}">',
      '\t$2',
      '<iselseif condition="${3:secondCondition}"/>',
      '\t$4',
      '<iselse/>',
      '\t$0',
      '</isif>',
    ],
    description: 'ISML <isif>/<iselseif>/<iselse> conditional block',
  },
  {prefix: 'iselse', body: ['<iselse/>'], description: 'ISML <iselse/> branch'},
  {
    prefix: 'iselseif',
    body: ['<iselseif condition="${1:condition}"/>'],
    description: 'ISML <iselseif/> branch',
  },
  {
    prefix: 'isloop',
    body: ['<isloop items="${1:items}" var="${2:item}">', '\t$0', '</isloop>'],
    description: 'ISML <isloop> iteration',
  },
  {
    prefix: 'isloopstatus',
    body: ['<isloop items="${1:items}" var="${2:item}" status="${3:loopstate}">', '\t$0', '</isloop>'],
    description: 'ISML <isloop> with loop status object',
  },
  {
    prefix: 'isinclude',
    body: ['<isinclude template="${1:path/to/template}"/>'],
    description: 'Include another ISML template',
  },
  {
    prefix: 'isincludeurl',
    body: ['<isinclude url="${1:URLUtils.url(\'Controller-Action\')}"/>'],
    description: 'Include a remote URL',
  },
  {
    prefix: 'isincludeurllocale',
    body: ["<isinclude url=\"${1:URLUtils.url('Controller-Action', 'locale', request.locale)}\"/>"],
    description: 'Remote include with explicit locale',
  },
  {
    prefix: 'isset',
    body: ['<isset name="${1:name}" value="${2:value}" scope="${3|page,request,session|}"/>'],
    description: 'Set a variable in ISML',
  },
  {
    prefix: 'isscript',
    body: ['<isscript>', '\t$0', '</isscript>'],
    description: 'ISML <isscript> server-side script block',
  },
  {
    prefix: 'isscriptrequire',
    body: ['<isscript>', "\tvar ${1:module} = require('${2:*/cartridge/scripts/module}');", '\t$0', '</isscript>'],
    description: 'ISML <isscript> with a require() call',
  },
  {
    prefix: 'isscriptassets',
    body: [
      '<isscript>',
      "\tvar assets = require('*/cartridge/scripts/assets');",
      "\tassets.addCss('${1:/css/global.css}');",
      "\tassets.addJs('${2:/js/main.js}');",
      '</isscript>',
    ],
    description: '<isscript> registering CSS/JS assets via assets module',
  },
  {
    prefix: 'isdecorate',
    body: ['<isdecorate template="${1:common/layout/page}">', '\t$0', '</isdecorate>'],
    description: 'Decorate template with a layout',
  },
  {
    prefix: 'iscontent',
    body: [
      '<iscontent type="${1|text/html,text/xml,application/json,text/plain|}" charset="${2:UTF-8}" compact="${3|true,false|}"/>',
    ],
    description: 'Set the response content type',
  },
  {
    prefix: 'iscomment',
    body: ['<iscomment>', '\t$0', '</iscomment>'],
    description: 'ISML comment block (not rendered)',
  },
  {
    prefix: 'ismodule',
    body: ['<ismodule template="${1:path/to/module}" name="${2:moduleName}" attribute="${3:attr}"/>'],
    description: 'Define a custom ISML module',
  },
  {
    prefix: 'isprint',
    body: [
      '<isprint value="${1:value}" encoding="${2|on,off,htmlcontent,htmlsinglequote,htmldoublequote,htmlunquote,jshtml,jsattr,jsblock,jssource,jsonvalue,uricomponent,uristrict,xmlcontent,xmlsinglequote,xmldoublequote,xmlcomment|}"/>',
    ],
    description: 'Render a value with explicit encoding',
  },
  {
    prefix: 'isprintformatter',
    body: ['<isprint value="${1:value}" formatter="${2:#,##0.00}"/>'],
    description: 'Render a value with a number/date formatter',
  },
  {
    prefix: 'isredirect',
    body: ['<isredirect location="${1:URLUtils.url(\'Controller-Action\')}" permanent="${2|false,true|}"/>'],
    description: 'Redirect the response to another URL',
  },
  {
    prefix: 'iscache',
    body: ['<iscache type="${1|relative,daily|}" hour="${2:24}" minute="${3:0}" varyby="${4:price_promotion}"/>'],
    description: 'Configure page caching',
  },
  {
    prefix: 'isobject',
    body: ['<isobject object="${1:pdict.product}" view="${2:detail}">', '\t$0', '</isobject>'],
    description: 'Wrap markup so personalization tracking can pick up the object',
  },
  {
    prefix: 'isslot',
    body: [
      '<isslot id="${1:slot-id}" description="${2:description}" context="${3|global,category,folder|}" context-object="${4:pdict.CurrentCategory}"/>',
    ],
    description: 'Render a content slot',
  },
  {
    prefix: 'isstatus',
    body: ['<isstatus value="${1|200,301,302,404,500|}"/>'],
    description: 'Set the HTTP response status',
  },
  {prefix: 'isbreak', body: ['<isbreak/>'], description: 'Break out of the enclosing <isloop>'},
  {prefix: 'iscontinue', body: ['<iscontinue/>'], description: 'Skip to next iteration of the enclosing <isloop>'},
  {prefix: 'isnext', body: ['<isnext/>'], description: 'Move to next iteration of the enclosing <isloop>'},
  {
    prefix: 'iscustomtag',
    body: ['<iscustom-${1:tagname} ${2:attribute}="${3:value}"/>'],
    description: 'Invoke a custom ISML module tag',
  },
  {
    prefix: 'isactivedatacontext',
    body: ['<isactivedatacontext category="${1:pdict.CurrentCategory.ID}"/>'],
    description: 'Set Active Data context for tracking',
  },
  {
    prefix: 'isanalyticsoff',
    body: ['<isanalyticsoff/>'],
    description: 'Suppress Active Data tracking for the surrounding block',
  },
  {
    prefix: 'iscomponent',
    body: ['<iscomponent type_id="${1:cartridge/component}" ${2:attribute}="${3:value}"/>'],
    description: 'Render a Page Designer component (legacy <iscomponent>)',
  },
  {
    prefix: 'isregion',
    body: [
      '<isscript>',
      "\tvar PageMgr = require('dw/experience/PageMgr');",
      '</isscript>',
      '<isprint value="${1:PageMgr.renderRegion(pdict.page.regions.\\$\\{regionId})}" encoding="off"/>',
    ],
    description: 'Render a Page Designer region inside a page template',
  },
  {
    prefix: 'isincludeoptional',
    body: ['<isinclude template="${1:path/to/template}" sf-toolkit="off"/>'],
    description: 'Include without storefront toolkit injection (no Active Data scripts)',
  },
  {
    prefix: 'isloopiter',
    body: ['<isloop iterator="${1:iterator}" alias="${2:item}">', '\t$0', '</isloop>'],
    description: '<isloop> using iterator/alias (alternative form to items/var)',
  },
  {
    prefix: 'isobjectview',
    body: [
      '<isobject object="${1:pdict.product}" view="${2|detail,recommendation,searchhit,none|}">',
      '\t$0',
      '</isobject>',
    ],
    description: '<isobject> with the most common view values',
  },
  {
    prefix: 'isprintformatdate',
    body: ['<isprint value="${1:date}" formatter="${2:yyyy-MM-dd HH:mm}" timezone="${3|SITE,INSTANCE,UTC|}"/>'],
    description: 'Format a date with explicit timezone',
  },
  {
    prefix: 'isprintformatcurrency',
    body: ['<isprint value="${1:amount}" formatter="${2:#,##0.00}"/>'],
    description: 'Format a currency value',
  },
  {
    prefix: 'iscacheoff',
    body: ['<iscache type="relative" hour="0" minute="0"/>'],
    description: 'Disable caching for this template',
  },
  {
    prefix: 'iscachevarycustomer',
    body: [
      '<iscache type="${1|relative,daily|}" hour="${2:1}" minute="${3:0}" varyby="price_promotion" status="${4|on,off|}"/>',
    ],
    description: 'Cache with price/promotion variation (per-customer-segment)',
  },
  {
    prefix: 'isslotglobal',
    body: ['<isslot id="${1:slot-id}" description="${2:description}" context="global"/>'],
    description: 'Render a global content slot',
  },
  {
    prefix: 'isslotcategory',
    body: [
      '<isslot id="${1:slot-id}" description="${2:description}" context="category" context-object="${3:pdict.CurrentCategory}"/>',
    ],
    description: 'Render a category-context content slot',
  },
  {
    prefix: 'isslotfolder',
    body: [
      '<isslot id="${1:slot-id}" description="${2:description}" context="folder" context-object="${3:pdict.CurrentFolder}"/>',
    ],
    description: 'Render a folder-context content slot',
  },
  {
    prefix: 'isscriptpdict',
    body: ['<isscript>', '\tvar ${1:variable} = pdict.${2:property};', '\t$0', '</isscript>'],
    description: '<isscript> reading from pdict',
  },
  {
    prefix: 'isscripttransaction',
    body: [
      '<isscript>',
      "\tvar Transaction = require('dw/system/Transaction');",
      '\tTransaction.wrap(function () {',
      '\t\t$0',
      '\t});',
      '</isscript>',
    ],
    description: '<isscript> with a Transaction.wrap() block',
  },
];

export interface CompletionContext {
  partial: string;
  hasLeadingBracket: boolean;
  startOffset: number;
}

const PARTIAL_TAG_RE = /<?(is[a-zA-Z]*)$/i;

export function detectCompletionContext(linePrefix: string): CompletionContext | null {
  const match = PARTIAL_TAG_RE.exec(linePrefix);
  if (!match) return null;

  return {
    partial: match[0],
    hasLeadingBracket: match[0].startsWith('<'),
    startOffset: linePrefix.length - match[0].length,
  };
}
