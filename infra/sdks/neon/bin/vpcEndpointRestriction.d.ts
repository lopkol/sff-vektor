import * as pulumi from "@pulumi/pulumi";
export declare class VpcEndpointRestriction extends pulumi.CustomResource {
    /**
     * Get an existing VpcEndpointRestriction resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: VpcEndpointRestrictionState, opts?: pulumi.CustomResourceOptions): VpcEndpointRestriction;
    /**
     * Returns true if the given object is an instance of VpcEndpointRestriction.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is VpcEndpointRestriction;
    /**
     * A descriptive label for the VPC endpoint.
     */
    readonly label: pulumi.Output<string>;
    /**
     * The Neon project ID.
     */
    readonly projectId: pulumi.Output<string>;
    /**
     * The VPC endpoint ID.
     */
    readonly vpcEndpointId: pulumi.Output<string>;
    readonly vpcEndpointRestrictionId: pulumi.Output<string>;
    /**
     * Create a VpcEndpointRestriction resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: VpcEndpointRestrictionArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering VpcEndpointRestriction resources.
 */
export interface VpcEndpointRestrictionState {
    /**
     * A descriptive label for the VPC endpoint.
     */
    label?: pulumi.Input<string>;
    /**
     * The Neon project ID.
     */
    projectId?: pulumi.Input<string>;
    /**
     * The VPC endpoint ID.
     */
    vpcEndpointId?: pulumi.Input<string>;
    vpcEndpointRestrictionId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a VpcEndpointRestriction resource.
 */
export interface VpcEndpointRestrictionArgs {
    /**
     * A descriptive label for the VPC endpoint.
     */
    label: pulumi.Input<string>;
    /**
     * The Neon project ID.
     */
    projectId: pulumi.Input<string>;
    /**
     * The VPC endpoint ID.
     */
    vpcEndpointId: pulumi.Input<string>;
    vpcEndpointRestrictionId?: pulumi.Input<string>;
}
