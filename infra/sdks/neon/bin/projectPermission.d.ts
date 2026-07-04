import * as pulumi from "@pulumi/pulumi";
export declare class ProjectPermission extends pulumi.CustomResource {
    /**
     * Get an existing ProjectPermission resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param state Any extra arguments used during the lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    static get(name: string, id: pulumi.Input<pulumi.ID>, state?: ProjectPermissionState, opts?: pulumi.CustomResourceOptions): ProjectPermission;
    /**
     * Returns true if the given object is an instance of ProjectPermission.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is ProjectPermission;
    /**
     * Email of the user whom to grant project permission.
     */
    readonly grantee: pulumi.Output<string>;
    /**
     * Project ID.
     */
    readonly projectId: pulumi.Output<string>;
    /**
     * Create a ProjectPermission resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: ProjectPermissionArgs, opts?: pulumi.CustomResourceOptions);
}
/**
 * Input properties used for looking up and filtering ProjectPermission resources.
 */
export interface ProjectPermissionState {
    /**
     * Email of the user whom to grant project permission.
     */
    grantee?: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId?: pulumi.Input<string>;
}
/**
 * The set of arguments for constructing a ProjectPermission resource.
 */
export interface ProjectPermissionArgs {
    /**
     * Email of the user whom to grant project permission.
     */
    grantee: pulumi.Input<string>;
    /**
     * Project ID.
     */
    projectId: pulumi.Input<string>;
}
