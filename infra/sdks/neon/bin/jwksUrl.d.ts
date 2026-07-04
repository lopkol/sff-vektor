import * as pulumi from "@pulumi/pulumi";
export declare class JwksUrl extends pulumi.CustomResource {
    /**
     * Get an existing JwksUrl resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: JwksUrlState, opts?: pulumi.CustomResourceOptions): JwksUrl;
    /**
     * Returns true if the given object is an instance of JwksUrl.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is JwksUrl;
    /**
     * Branch ID.
     */
    readonly branchId: pulumi.Output<string | undefined>;
    /**
     * The URL that lists the JWKS.
     */
    readonly jwksUrl: pulumi.Output<string>;
    readonly jwksUrlId: pulumi.Output<string>;
    /**
     * The name of the required JWT Audience to be used.
     */
    readonly jwtAudience: pulumi.Output<string | undefined>;
    /**
     * Project ID.
     */
    readonly projectId: pulumi.Output<string>;
    /**
     * The name of the authentication provider.
     */
    readonly providerName: pulumi.Output<string>;
    /**
     * The roles the JWKS should be mapped to.
     */
    readonly roleNames: pulumi.Output<string[]>;
    /**
     * Create a JwksUrl resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: JwksUrlArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering JwksUrl resources.
 */
export interface JwksUrlState {
    /**
     * Branch ID.
     */
    branchId?: pulumi.Input<string>;
    /**
     * The URL that lists the JWKS.
     */
    jwksUrl?: pulumi.Input<string>;
    jwksUrlId?: pulumi.Input<string>;
    /**
     * The name of the required JWT Audience to be used.
     */
    jwtAudience?: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId?: pulumi.Input<string>;
    /**
     * The name of the authentication provider.
     */
    providerName?: pulumi.Input<string>;
    /**
     * The roles the JWKS should be mapped to.
     */
    roleNames?: pulumi.Input<pulumi.Input<string>[]>;
}
/**
 * The set of arguments for constructing a JwksUrl resource.
 */
export interface JwksUrlArgs {
    /**
     * Branch ID.
     */
    branchId?: pulumi.Input<string>;
    /**
     * The URL that lists the JWKS.
     */
    jwksUrl: pulumi.Input<string>;
    jwksUrlId?: pulumi.Input<string>;
    /**
     * The name of the required JWT Audience to be used.
     */
    jwtAudience?: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId: pulumi.Input<string>;
    /**
     * The name of the authentication provider.
     */
    providerName: pulumi.Input<string>;
    /**
     * The roles the JWKS should be mapped to.
     */
    roleNames: pulumi.Input<pulumi.Input<string>[]>;
}
