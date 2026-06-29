import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface EncryptedObject extends CustomAttributes {
        }
    }
}

/**
 * Defines a API base class for classes containing
 * encrypted attributes like credit cards.
 * 
 * Note: this method handles sensitive financial and card holder data.
 * Pay special attention to PCI DSS v3. requirements 1, 3, 7, and 9.
 */
declare abstract class EncryptedObject<T extends ICustomAttributes.EncryptedObject = ICustomAttributes.EncryptedObject> extends ExtensibleObject<T> {
}

export = EncryptedObject;
