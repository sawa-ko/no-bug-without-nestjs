import 'reflect-metadata';

import {
  BaseEntity,
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  Rel
} from '@mikro-orm/core'
import {PostgreSqlDriver} from "@mikro-orm/postgresql";

@Entity({ abstract: true, comment: 'Default configuration of all entities.' })
abstract class ParentEntity extends BaseEntity<ParentEntity, 'id'> {
  @Property({
    columnType: 'timestamp',
    type: 'date',
  })
  public createdAt = new Date();
  
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;
  
  @Property({
    columnType: 'timestamp',
    onUpdate: () => new Date(),
    type: 'date',
  })
  public updatedAt = new Date();
  
  @Property({ comment: 'Optimistic Locking transactions.', version: true, type: "numeric" })
  public version!: number;
  
  public [OptionalProps]?: 'createdAt' | 'updatedAt' | 'version';
}

@Entity({
  comment: 'Information about all users on the platform.',
  tableName: 'auth_users',
})
export class AuthUserEntity extends ParentEntity {
  @Property({
    columnType: 'varchar',
    comment: 'Unique username per user.',
    length: 30,
    type: 'string',
    unique: true,
  })
  public username!: string;
  
  @OneToMany(() => ProjectMembersEntity, (m) => m.user, {
    comment: 'Projects in which the user is a member.',
  })
  public projects = new Collection<ProjectMembersEntity>(this);
}

@Entity({
  comment: 'Users invited to projects.',
  tableName: 'projects_members',
})
export class ProjectMembersEntity extends ParentEntity {
  /**
   * Many-to-One relationship representing the project to which the user has been invited.
   * If the project is deleted, all associated memberships will be removed.
   */
  @ManyToOne({
    comment: 'Project to which the user is a member.',
    entity: () => ProjectEntity,
    onDelete: 'cascade',
  })
  public project!: Rel<ProjectEntity>;
  
  /**
   * Many-to-One relationship linking the user to the membership record.
   * If the user is deleted, their membership records across projects will also be removed.
   */
  @ManyToOne({
    comment: 'User member of the project.',
    entity: () => AuthUserEntity,
    onDelete: 'cascade',
  })
  public user!: Rel<AuthUserEntity>;
}

@Entity({
  comment: 'Projects to manage and group boards.',
  tableName: 'projects',
})
export class ProjectEntity extends ParentEntity {
  /**
   * A collection of users who have been invited to participate or collaborate on this project.
   */
  @OneToMany(() => ProjectMembersEntity, (m) => m.project, {
    comment: 'Users invited to the project.',
  })
  public members = new Collection<Rel<ProjectMembersEntity>>(this);
  
  /**
   * The official name of the project.
   */
  @Property({
    comment: "Project's name.",
    length: 50,
    type: 'varchar',
  })
  public name!: string;
  
  /**
   * The user who owns or initiated the project.
   * Important: If the owner user account is deleted, any projects associated with that user will also be removed.
   */
  @ManyToOne({
    comment:
      'Project owner user. If the owner deletes their account, the projects will also be affected.',
    entity: () => AuthUserEntity,
    onDelete: 'cascade',
  })
  public owner!: Rel<AuthUserEntity>;
}


(async () => {
  const client = await MikroORM.init<PostgreSqlDriver>({
    dbName: 'test',
    type: 'postgresql',
    clientUrl: 'postgres://postgres:Sawa-ko-Sawa@localhost:5432/test',
    entities: [AuthUserEntity, ProjectEntity, ProjectMembersEntity],
    loadStrategy: LoadStrategy.JOINED,
    forceEntityConstructor: true,
    
  })
  
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
  
  console.log(userSearch!.projects[0].project);
  
  await client.close(true);
})();