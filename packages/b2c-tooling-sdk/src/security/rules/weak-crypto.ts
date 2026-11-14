/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {defineScriptRule} from '../rule.js';
import {calleeName, memberChain, requireSpecifier, staticString} from '../script/helpers.js';

const WEAK_CLASSES = new Set(['WeakCipher', 'WeakMac', 'WeakMessageDigest', 'WeakSignature']);
const WEAK_DIGESTS = /^(MD2|MD5|SHA|SHA-?1|HmacMD5|HmacSHA1)$/i;
const WEAK_TRANSFORMATION = /(^|\/)(DES|DESede|TripleDES|RC2|RC4|ARCFOUR|Blowfish)(\/|$)|\/ECB(\/|$)/i;
const CIPHER_METHODS = new Set(['encrypt', 'decrypt', 'encryptBytes', 'decryptBytes']);
const DIGEST_CONSTRUCTORS = /^(MessageDigest|Mac)$/;

export default defineScriptRule({
  id: 'weak-crypto',
  severity: 'medium',
  confidence: 'high',
  category: 'crypto',
  cwe: ['CWE-327', 'CWE-328'],
  description:
    'Weak cryptography: the dw.crypto Weak* classes, MD5/SHA-1 digests, DES/RC4/Blowfish ciphers, or ECB mode.',
  remediation:
    'Use dw.crypto.Cipher with AES in GCM or CBC mode, and SHA-256 or stronger for MessageDigest and Mac. Keep the Weak* classes for interoperating with legacy systems only.',
  create(context) {
    return {
      CallExpression(node) {
        const spec = requireSpecifier(node);
        if (spec?.startsWith('dw/crypto/') && WEAK_CLASSES.has(spec.slice('dw/crypto/'.length))) {
          context.report({node, message: `${spec} uses deprecated, weak algorithms.`});
          return;
        }
        if (CIPHER_METHODS.has(calleeName(node) ?? '')) {
          for (const arg of node.arguments) {
            const value = staticString(arg);
            if (value && WEAK_TRANSFORMATION.test(value)) {
              context.report({node: arg, message: `Cipher transformation "${value}" is weak.`});
            }
          }
        }
      },
      NewExpression(node) {
        const required = requireSpecifier(node.callee);
        const name =
          node.callee.type === 'Identifier'
            ? node.callee.name
            : required
              ? required.split('/').at(-1)
              : memberChain(node.callee)?.at(-1);
        if (!name || !DIGEST_CONSTRUCTORS.test(name)) return;
        const algorithm = staticString(node.arguments[0]);
        if (algorithm && WEAK_DIGESTS.test(algorithm)) {
          context.report({node: node.arguments[0], message: `${name} algorithm "${algorithm}" is weak.`});
        }
      },
      MemberExpression(node) {
        const chain = memberChain(node);
        if (chain && chain.length === 3 && chain[0] === 'dw' && chain[1] === 'crypto' && WEAK_CLASSES.has(chain[2])) {
          context.report({node, message: `dw.crypto.${chain[2]} uses deprecated, weak algorithms.`});
        }
      },
    };
  },
});
