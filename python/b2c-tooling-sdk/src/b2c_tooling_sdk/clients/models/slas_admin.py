# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, RootModel


class Tier(Enum):
    """
    This read only value relates to the B2C Comerce realm of the customer.
      - XS = Bronze and Bronze+
      - S = Silver and Silver+
      - M = Gold and Gold+
      - L = Platinum and Platinum+

    """

    XS = "XS"
    S = "S"
    M = "M"
    L = "L"


class Tenant(BaseModel):
    """
    Tenant
    """

    model_config = ConfigDict(
        extra="allow",
    )
    tenantId: str = Field(..., examples=["aaaa_prd"], max_length=8)
    merchantId: int = Field(..., examples=[1], ge=0)
    description: str = Field(..., examples=["SLAS Merchant Name"], max_length=256)
    contact: str = Field(..., examples=["SLAS Tenant Contact"], max_length=256)
    emailAddress: str = Field(..., examples=["tenant_contact@slas.tst"], max_length=200)
    phoneNo: str = Field(..., examples=["000-000-0000"], max_length=50)
    isDeleted: bool = Field(..., examples=[False], max_length=1)
    status: str = Field(..., examples=["CLEAR"], max_length=16)
    tier: Tier = Field(
        ...,
        description="This read only value relates to the B2C Comerce realm of the customer.\n  - XS = Bronze and Bronze+\n  - S = Silver and Silver+\n  - M = Gold and Gold+\n  - L = Platinum and Platinum+\n",
        examples=["L"],
    )
    requestQuotaPerMinute: float = Field(
        ...,
        description="This read only value shows the the number of requests that can be made per minute.",
        examples=[8000],
    )


class ErrorResponse(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    title: str = Field(
        ...,
        description="A short, human-readable summary of the problem\ntype.  It will not change from occurrence to occurrence of the \nproblem, except for purposes of localization\n",
        examples=["You do not have enough credit"],
        max_length=256,
    )
    type: str = Field(
        ...,
        description='A URI reference [RFC3986] that identifies the\nproblem type.  This specification encourages that, when\ndereferenced, it provide human-readable documentation for the\nproblem type (e.g., using HTML [W3C.REC-html5-20141028]).  When\nthis member is not present, its value is assumed to be\n"about:blank". It accepts relative URIs; this means\nthat they must be resolved relative to the document\'s base URI, as\nper [RFC3986], Section 5.\n',
        examples=["NotEnoughMoney"],
        max_length=2048,
    )
    detail: str = Field(
        ...,
        description="A human-readable explanation specific to this occurrence of the problem.",
        examples=["Your current balance is 30, but that costs 50"],
    )
    instance: str | None = Field(
        None,
        description="A URI reference that identifies the specific\noccurrence of the problem.  It may or may not yield further\ninformation if dereferenced.  It accepts relative URIs; this means\nthat they must be resolved relative to the document's base URI, as\nper [RFC3986], Section 5.\n",
        examples=["/account/12345/msgs/abc"],
        max_length=2048,
    )


class TenantDto(BaseModel):
    """
    Create or update tenants
    """

    tenantId: str = Field(..., examples=["aaaa_prd"], max_length=8)
    merchantName: str = Field(..., description="Name of the merchant.", examples=["Merchant Name"], max_length=256)
    description: str = Field(..., examples=["Additional information about the tenant."], max_length=256)
    contact: str = Field(..., examples=["Name of the merchant's designated contact."], max_length=256)
    emailAddress: str = Field(
        ..., description="Email address of the designated contact.", examples=["joe.shopper@foo.org"], max_length=200
    )
    phoneNo: str = Field(
        ..., description="Phone number of the designated contact.", examples=["+1 000-000-0000"], max_length=50
    )


class Scope(RootModel[str]):
    root: str = Field(..., examples=["sfcc.products sfcc.catalogs sfcc.customers:ro"], max_length=100)


class Channel(RootModel[str]):
    root: str = Field(..., examples=["RefArch SiteGenesis"], max_length=1024)


class Client(BaseModel):
    clientId: str = Field(
        ..., description="Client ID", examples=["fd0d4ab9-bb85-4c04-bebd-589bd74bdd75"], max_length=100
    )
    name: str = Field(..., description="Client Name", examples=["Client Name"], max_length=100)
    secret: str = Field(
        ...,
        description="Client Secret. The secret will only display on create and if the secret was updated when updating the client.",
        examples=["client-secret"],
        max_length=256,
    )
    scopes: list[Scope] = Field(
        ...,
        description='Merchant scopes. These scopes allows different permissions in SLAS and B2C commerce. \nShopper Custom Objects additionally provides a way to do granular scoping besides the standard `sfcc.shopper-custom-objects` like `sfcc.shopper-custom-objects.xyz`\nSLAS is capable of handling a maximum of 20 Custom Object scopes.\n\nFor B2C Commerce scope details, see the [Authorization Scopes Catalog](https://developer.salesforce.com/docs/commerce/commerce-api/guide/auth-z-scope-catalog.html)."',
        examples=[["sfcc.products", "sfcc.catalogs", "sfcc.customers:ro"]],
    )
    redirectUri: str = Field(
        ...,
        description="An absolute URL, beginning with a protocol",
        examples=["https://www.salesforce.com"],
        max_length=2048,
    )
    callbackUri: str = Field(
        ...,
        description="An absolute URL, beginning with a protocol",
        examples=["https://www.salesforce.com"],
        max_length=2048,
    )
    channels: list[Channel] = Field(..., description="Client Channels", examples=[["RefArch", "SiteGenensis"]])
    isPrivateClient: bool | None = Field(None, description="Private or Public Client", examples=[True])
    loginEpRestrict: bool | None = Field(
        None,
        description="When enabling (true) this will restrict all calls to the `\\login` endpoint for the Client Id. When calling the `\\login` endpoint and `loginEpRestrict` is enabled a HTTP Status code of 403 will be returned.",
        examples=[False],
        max_length=1,
    )


class ClientListResponse(BaseModel):
    data: list[Client] = Field(..., description="An array of clients.")


class Scope1(RootModel[str]):
    root: str = Field(..., examples=["sfcc.products sfcc.catalogs sfcc.customers:ro"], max_length=4096)


class RedirectUriItem(RootModel[str]):
    root: str = Field(..., examples=["http://localhost:3000/callback"], max_length=2048)


class CallbackUriItem(RootModel[str]):
    root: str = Field(..., examples=["localhost:3000/passwordless-login-callback"], max_length=2048)


class ClientRequest(BaseModel):
    """
    Used to create and update a SLAS Client
    """

    name: str = Field(..., description="Client Name", examples=["High Adventure Wear"], max_length=100)
    clientId: str = Field(
        ...,
        description="SLAS client id. Must match the query parameter.",
        examples=["fd0d4ab9-bb85-4c04-bebd-589bd74bdd75"],
        max_length=100,
    )
    secret: str = Field(
        ...,
        description="SLAS client secret. On create if left blank then a secret will be generated.",
        examples=["client_secret"],
        max_length=256,
    )
    scopes: list[Scope1] = Field(
        ...,
        description='Merchant scopes. These scopes allows different permissions in SLAS and B2C commerce. \nShopper Custom Objects additionally provides a way to do granular scoping besides the standard `sfcc.shopper-custom-objects` like `sfcc.shopper-custom-objects.xyz` \nSLAS is capable of handling a maximum of 20 Custom Object scopes."',
        examples=[["sfcc.products", "sfcc.catalogs", "sfcc.customers:ro"]],
    )
    redirectUri: list[RedirectUriItem] = Field(
        ...,
        description="Array of SLAS redirect URLs. Include protocol and domain name in each URL. Wildcards supported.",
        examples=[["http://localhost:3000/callback", "https://*.example.com/callback"]],
    )
    callbackUri: list[CallbackUriItem] | None = Field(
        None,
        description="Array of SLAS callback URLs that will be used for passworless login and password reset when mode=callback. Include protocol and domain name in each URL. Wildcards are NOT supported.",
        examples=[
            ["http://localhost:3000/password-reset-callback", "http://localhost:3000/passwordless-login-callback"]
        ],
    )
    channels: list[Channel] = Field(..., description="Client Channels", examples=[["RefArch", "SiteGenensis"]])
    isPrivateClient: bool = Field(
        ..., description="Private or Public Client. If left blank the client will default to private.", examples=[True]
    )
    loginEpRestrict: bool | None = Field(
        None,
        description="When enabling (true) this will restrict all calls to the `\\login` endpoint for the Client Id. When calling the `\\login` endpoint and `loginEpRestrict` is enabled a HTTP Status code of 403 will be returned.",
        examples=[False],
    )


class PasswordTemplateActionType(Enum):
    """
    Describes the type of action that the password action template will be used for.
    Here are the actions that each enumerated string refers to:
      - `PWDLESS_LOGIN`: Passwordless login
      - `PWD_RESET_ACTION`: Password reset
      - `PWD_FORGOT_ACTION`: Forgot password
    """

    PWDLESS_LOGIN = "PWDLESS_LOGIN"
    PWD_RESET_ACTION = "PWD_RESET_ACTION"
    PWD_FORGOT_ACTION = "PWD_FORGOT_ACTION"


class PasswordTemplateType(Enum):
    """
    Identifies the type of mode that the password action template will be used for.
    """

    SMS = "SMS"
    EMAIL = "EMAIL"


class PasswordActionTemplate(BaseModel):
    channelId: str = Field(..., examples=["SiteGenesis"], max_length=36)
    name: str = Field(..., examples=["Password Action Email Template"], max_length=128)
    subject: str = Field(..., examples=["Password Action Token Request"], max_length=128)
    link: str = Field(..., examples=["This is your password action token: ${token}"], max_length=2048)
    locale: str = Field(
        ...,
        description="Identifies the locale of the template. Must be one of the [language tag strings supported by JDK 11](https://www.oracle.com/java/technologies/javase/jdk11-suported-locales.html). The string is stored in all lowercase.",
        examples=["en-us"],
        max_length=16,
    )
    actionType: PasswordTemplateActionType
    templateType: PasswordTemplateType
    template: str = Field(
        ...,
        examples=[
            "Passwordless Login Token Request\nYou're receiving this because you requested a passwordless login token for your account. ${link}"
        ],
        max_length=2048,
    )


class Scope2(RootModel[str]):
    root: str = Field(..., examples=["openid email profile"], max_length=8192)


class LoginMergeClaim(RootModel[str]):
    root: str = Field(..., examples=["email"], max_length=256)


class OidcClaimMapperItem(RootModel[str]):
    root: str = Field(
        ...,
        examples=[
            "accessToken=access refresh_token accessTokenTTL=expires_in idToken=id_token subject=sub email=email userId=sub familyName=family_name givenName=given_name name=name"
        ],
        max_length=1024,
    )


class IdentityProviderResponse(BaseModel):
    """
    Identity provider Response
    """

    name: str = Field(..., description="Identity Provider Name", examples=["google"], max_length=200)
    authUrl: str = Field(
        ..., description="IDP authorization URL", examples=["https://www.salesforce.com/authorize"], max_length=256
    )
    tokenUrl: str = Field(
        ..., description="IDP token URL", examples=["https://www.salesforce.com/token"], max_length=256
    )
    tokenInfoUrl: str = Field(
        ..., description="IDP token info URL", examples=["https://www.salesforce.com/inspect"], max_length=256
    )
    userInfoUrl: str = Field(
        ..., description="IDP user info URL", examples=["https://www.salesforce.com/userinfo"], max_length=256
    )
    redirectUrl: str = Field(
        ...,
        description="Redirect URL to go to after IDP flow is complete. This URL must be registered with the IDP.",
        examples=["https://www.salesforce.com/idp/callback"],
        max_length=256,
    )
    wellKnownUrl: str | None = Field(
        None,
        description="IDP to get OIDC configuration.",
        examples=["https://www.salesforce.com/.well-known/openid-configuration"],
        max_length=256,
    )
    clientId: str = Field(
        ...,
        description="Client Id of the third party IDP.",
        examples=["934277749308-02dg4398n3s31ofge8cot46jirn3kpkf.apps.googleusercontent.com"],
        max_length=128,
    )
    clientSecret: str = Field(
        ...,
        description="Client Secret of the third party IDP. For Apple copy the contents from the .p8 file that was downloaded from Apple between -*----BEGIN PRIVATE KEY-----* and -*---END PRIVATE KEY-----* markers.",
        examples=["aKZM1xEnZopNP2bm2gc3GKex"],
        max_length=512,
    )
    isPreferred: bool = Field(
        ...,
        description="Indicates if the IDP configuration is the Preferred SLAS IDP for the Tenant Id.",
        examples=[True],
        max_length=1,
    )
    isClientCredsBody: bool = Field(
        ...,
        description="Default is to place the client credentials in a basic authorization header for the call to the IDP. If true, the client credentials are placed in the POST body to the IDP.",
        examples=[False],
        max_length=1,
    )
    scopes: list[Scope2] = Field(..., description="Scopes needed by the IDP.", examples=[["oidc", "email", "profile"]])
    teamId: str | None = Field(
        None,
        description="Apple Team ID. Used primarily for Sign with Apple in generating the client secret.",
        examples=["appleTeamId"],
        max_length=32,
    )
    keyId: str | None = Field(
        None,
        description="Apple key ID. This is the Key ID that was obtained from Apple when the the private key for client authentication was created. Used primarily for Sign with Apple in generating the client secret.",
        examples=["appleKeyId"],
        max_length=8192,
    )
    loginMergeClaims: list[LoginMergeClaim] | None = Field(
        None,
        description="List of user info claims that can be used as identifiers to look up and merge with an existing B2C Commerce profile for a registered shopper or an existing B2C Commerce profile created via federated login with an external Identity Provider with the same merge claim as this one. If multiple matching B2C Commerce shopper (customer) profiles are found, the external profile is merged with the most recently created shopper (customer) profile. Refer to the Merge Shopper Profiles user guide for more details.\n\nNote: When configuring an Apple IDP, 'email' and 'sub' are the only supported merge claims.\n",
        examples=[["email", "phone"]],
    )
    oidcClaimMapper: list[OidcClaimMapperItem] | None = Field(
        None,
        description="Mapping from the identity provider’s token claims for SLAS to get user information values when the user successfully authenticates. The values in this array should be setup using the following `key=value` pair pattern. The key part is the SLAS key with the value part being the OIDC claim key.",
        examples=[
            [
                "accessToken=access_token",
                "refreshToken=refresh_token",
                "accessTokenTTL=expires_in",
                "idToken=id_token",
                "subject=sub",
                "email=email",
                "userId=sub",
                "familyName=family_name",
                "givenName=given_name",
                "name=name",
            ]
        ],
    )


class IdpListResponse(BaseModel):
    data: list[IdentityProviderResponse] = Field(..., description="An array of identity providers.")


class Name(Enum):
    """
    Identity Provider Name
    """

    adfs = "adfs"
    apple = "apple"
    auth0 = "auth0"
    azure = "azure"
    cognito = "cognito"
    facebook = "facebook"
    forgerock = "forgerock"
    gigya = "gigya"
    gigya_social = "gigya_social"
    google = "google"
    okta = "okta"
    ping = "ping"
    salesforce = "salesforce"


class OidcClaimMapperItem1(RootModel[str]):
    root: str = Field(
        ...,
        examples=[
            "accessToken=access_token efreshToken=refresh_token accessTokenTTL=expires_in idToken=id_token subject=sub email=email userId=sub familyName=family_name givenName=given_name name=name"
        ],
        max_length=1024,
    )


class IdentityProvider(BaseModel):
    """
    Identity provider
    """

    name: Name = Field(..., description="Identity Provider Name", examples=["google"])
    authUrl: str = Field(
        ..., description="IDP authorize URL", examples=["https://www.salesforce.com/authorize"], max_length=256
    )
    tokenUrl: str = Field(
        ..., description="IDP token URL", examples=["https://www.salesforce.com/token"], max_length=256
    )
    tokenInfoUrl: str = Field(
        ..., description="IDP token info URL", examples=["https://www.salesforce.com/introspect"], max_length=256
    )
    userInfoUrl: str = Field(
        ..., description="IDP user info URL", examples=["https://www.salesforce.com/userinfo"], max_length=256
    )
    redirectUrl: str = Field(
        ...,
        description="Redirect URL to go to after IDP flow is complete. This URL must be registered with the IDP.",
        examples=["https://www.salesforce.com/idp/callback"],
        max_length=256,
    )
    wellKnownUrl: str = Field(
        ...,
        description="IDP URL to get OIDC configuration.",
        examples=["https://www.salesforce.com/.well-known/openid-configuration"],
        max_length=256,
    )
    clientId: str = Field(
        ...,
        description="Client Id of the third party IDP.",
        examples=["934277749308-02dg4398n3s31ofge8cot46jirn3kpkf.apps.googleusercontent.com"],
        max_length=128,
    )
    clientSecret: str = Field(
        ...,
        description="Client Secret of the third party IDP. For Apple copy the contents from the .p8 file that was downloaded from Apple between -*----BEGIN PRIVATE KEY-----* and -*---END PRIVATE KEY-----* markers.",
        examples=["aKZM1xEnZopNP2bm2gc3GKex"],
        max_length=512,
    )
    preferenceValue: bool | None = Field(
        None,
        description="Set the IDP configuration as the Preferred SLAS IDP. Default value is `false`.",
        examples=[True],
        max_length=1,
    )
    isClientCredsBody: bool = Field(
        ...,
        description="Default is to place the client credentials in a basic authorization header for the call to the IDP. If true, the client credentials are placed in the POST body to the IDP.",
        examples=[False],
        max_length=1,
    )
    useWellKnown: bool | None = Field(
        None,
        description="If set to `true`, SLAS uses the `wellKnowUrl` value to populate the `authUrl`, `tokenUrl`, `userInfoUrl`, and `scopes` values from the identity provider. Default value is `false`.",
        examples=[False],
        max_length=1,
    )
    scopes: list[Scope2] = Field(..., description="IDP Scopes", examples=[["oidc", "email", "profile"]])
    teamId: str | None = Field(
        None,
        description="Apple Team Id. Used primarily for Sign with Apple in generating the client secret.",
        examples=["appleTeamId"],
        max_length=32,
    )
    keyId: str | None = Field(
        None,
        description="Apple key id. This is the Key ID that was obtained from Apple when the the private key for client authentication was created. Used primarily for Sign with Apple in generating the client secret.",
        examples=["appleKeyId"],
        max_length=32,
    )
    loginMergeClaims: list[LoginMergeClaim] | None = Field(
        None,
        description="List of user info claims that can be used as identifiers to look up and merge with an existing B2C Commerce profile for a registered shopper or an existing B2C Commerce profile created via federated login with an external Identity Provider with the same merge claim as this one. If multiple matching B2C Commerce shopper (customer) profiles are found, the external profile is merged with the most recently created shopper (customer) profile. Refer to the Merge Shopper Profiles user guide for more details.\nNote: When configuring an Apple IDP, 'email' and 'sub' are the only supported merge claims.\n",
        examples=[["email", "phone"]],
    )
    oidcClaimMapper: list[OidcClaimMapperItem1] | None = Field(
        None,
        description="Mapping from the identity provider’s token claims for SLAS to get user information values when the user successfully authenticates. The values in this array should be setup using the following `key=value` pair pattern. The key part is the SLAS key with the value part being the OIDC claim key.",
        examples=[
            [
                "accessToken=access_token",
                "refreshToken=refresh_token",
                "accessTokenTTL=expires_in",
                "idToken=id_token",
                "subject=sub",
                "email=email",
                "userId=sub",
                "familyName=family_name",
                "givenName=given_name",
                "name=name",
            ]
        ],
    )
