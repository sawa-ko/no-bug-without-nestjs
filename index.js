"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectEntity = exports.ProjectMembersEntity = exports.AuthUserEntity = void 0;
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
let ParentEntity = class ParentEntity extends core_1.BaseEntity {
    createdAt = new Date();
    id;
    updatedAt = new Date();
    version;
    [core_1.OptionalProps];
};
__decorate([
    (0, core_1.Property)({
        columnType: 'timestamp',
        type: 'date',
    }),
    __metadata("design:type", Object)
], ParentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, core_1.PrimaryKey)({
        autoincrement: true,
    }),
    __metadata("design:type", Number)
], ParentEntity.prototype, "id", void 0);
__decorate([
    (0, core_1.Property)({
        columnType: 'timestamp',
        onUpdate: () => new Date(),
        type: 'date',
    }),
    __metadata("design:type", Object)
], ParentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, core_1.Property)({ comment: 'Optimistic Locking transactions.', version: true, type: "numeric" }),
    __metadata("design:type", Number)
], ParentEntity.prototype, "version", void 0);
ParentEntity = __decorate([
    (0, core_1.Entity)({ abstract: true, comment: 'Default configuration of all entities.' })
], ParentEntity);
let AuthUserEntity = class AuthUserEntity extends ParentEntity {
    username;
    projects = new core_1.Collection(this);
};
exports.AuthUserEntity = AuthUserEntity;
__decorate([
    (0, core_1.Property)({
        columnType: 'varchar',
        comment: 'Unique username per user.',
        length: 30,
        type: 'string',
        unique: true,
    }),
    __metadata("design:type", String)
], AuthUserEntity.prototype, "username", void 0);
__decorate([
    (0, core_1.OneToMany)(() => ProjectMembersEntity, (m) => m.user, {
        comment: 'Projects in which the user is a member.',
    }),
    __metadata("design:type", Object)
], AuthUserEntity.prototype, "projects", void 0);
exports.AuthUserEntity = AuthUserEntity = __decorate([
    (0, core_1.Entity)({
        comment: 'Information about all users on the platform.',
        tableName: 'auth_users',
    })
], AuthUserEntity);
let ProjectMembersEntity = class ProjectMembersEntity extends ParentEntity {
    /**
     * Many-to-One relationship representing the project to which the user has been invited.
     * If the project is deleted, all associated memberships will be removed.
     */
    project;
    /**
     * Many-to-One relationship linking the user to the membership record.
     * If the user is deleted, their membership records across projects will also be removed.
     */
    user;
};
exports.ProjectMembersEntity = ProjectMembersEntity;
__decorate([
    (0, core_1.ManyToOne)({
        comment: 'Project to which the user is a member.',
        entity: () => ProjectEntity,
        onDelete: 'cascade',
    }),
    __metadata("design:type", Object)
], ProjectMembersEntity.prototype, "project", void 0);
__decorate([
    (0, core_1.ManyToOne)({
        comment: 'User member of the project.',
        entity: () => AuthUserEntity,
        onDelete: 'cascade',
    }),
    __metadata("design:type", Object)
], ProjectMembersEntity.prototype, "user", void 0);
exports.ProjectMembersEntity = ProjectMembersEntity = __decorate([
    (0, core_1.Entity)({
        comment: 'Users invited to projects.',
        tableName: 'projects_members',
    })
], ProjectMembersEntity);
let ProjectEntity = class ProjectEntity extends ParentEntity {
    /**
     * A collection of users who have been invited to participate or collaborate on this project.
     */
    members = new core_1.Collection(this);
    /**
     * The official name of the project.
     */
    name;
    /**
     * The user who owns or initiated the project.
     * Important: If the owner user account is deleted, any projects associated with that user will also be removed.
     */
    owner;
};
exports.ProjectEntity = ProjectEntity;
__decorate([
    (0, core_1.OneToMany)(() => ProjectMembersEntity, (m) => m.project, {
        comment: 'Users invited to the project.',
    }),
    __metadata("design:type", Object)
], ProjectEntity.prototype, "members", void 0);
__decorate([
    (0, core_1.Property)({
        comment: "Project's name.",
        length: 50,
        type: 'varchar',
    }),
    __metadata("design:type", String)
], ProjectEntity.prototype, "name", void 0);
__decorate([
    (0, core_1.ManyToOne)({
        comment: 'Project owner user. If the owner deletes their account, the projects will also be affected.',
        entity: () => AuthUserEntity,
        onDelete: 'cascade',
    }),
    __metadata("design:type", Object)
], ProjectEntity.prototype, "owner", void 0);
exports.ProjectEntity = ProjectEntity = __decorate([
    (0, core_1.Entity)({
        comment: 'Projects to manage and group boards.',
        tableName: 'projects',
    })
], ProjectEntity);
(async () => {
    const client = await core_1.MikroORM.init({
        dbName: 'test',
        type: 'postgresql',
        clientUrl: 'postgres://postgres:Sawa-ko-Sawa@localhost:5432/test',
        entities: [AuthUserEntity, ProjectEntity, ProjectMembersEntity],
        loadStrategy: core_1.LoadStrategy.JOINED,
        forceEntityConstructor: true,
    });
    await client.getSchemaGenerator().refreshDatabase();
    const em = client.em.fork();
    const user = em.create(AuthUserEntity, {
        username: 'test',
    });
    await em.persistAndFlush(user);
    const project = em.create(ProjectEntity, {
        name: 'test',
        owner: user,
    });
    await em.persistAndFlush(project);
    const member = em.create(ProjectMembersEntity, {
        project,
        user,
    });
    await em.persistAndFlush(member);
    const userSearch = await em.findOne(AuthUserEntity, { id: 1 }, {
        fields: [
            'id',
            'username',
            'projects.id',
            'projects.user.id',
            'projects.user.username',
            'projects.project.id',
            'projects.project.name',
            'projects.project.owner.id',
            'projects.project.owner.username',
        ],
    });
    console.log(userSearch.projects[0].project);
    await client.close(true);
})();
