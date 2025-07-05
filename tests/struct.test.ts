import {
	FuncBox,
	Impl,
	MultiFuncBox,
	Struct,
	StructValue,
	WithStruct,
} from "utils/Struct";
import { describe, it } from "vitest";

describe("结构体测试", () => {
	it("1", () => {
		const Profile = WithStruct(
			{
				avatar: String,
				bio: String,
			},
			{
				setAvatar: (self, avatar: string) => {
					self.avatar = avatar;
				},
				setBio: (self, bio: string) => {
					self.bio = bio;
				},
			}
		);

		// 示例代码测试
		const User = Struct({
			name: String,
			age: Number,
			email: String,
			profile: Profile,
			tags: Array,
			validate: Function,
		}); // { name: StringConstructor; age: NumberConstructor; email: StringConstructor; profile: typeof Profile.Constructor; tags: ArrayConstructor; validate: FunctionConstructor; }

		// 现在方法实现会有更好的类型提示
		const UserImpl_1 = Impl(User, {
			setName: (self, name: string) => {
				self.name = name.toUpperCase(); // 第一个实现：转大写
			},
			getInfo: (self) => {
				console.log("profile.avatar:", self.profile.avatar);
				return `Name: ${self.name}, Age: ${self.age}, Email: ${self.email}`;
			},
			tag: () => () => "User",
			of: () => (name: string, age: number, email: string) =>
				User.new({ name, age, email }),
		} as const);

		const UserImpl_2 = Impl(User, {
			setName: (self, name: string) => {
				self.name = name.toLowerCase(); // 第二个实现：转小写
			},
			setEmail: (self, id: number) => {
				self.email = `user${id}@example.com`;
			},
			birthday: (self) => {
				self.age += 1;
			},
		} as const);

		// 创建用户实例
		const user = User.new({
			name: "Alice",
			age: 25,
			email: "alice@example.com",
			profile: Profile.new({
				avatar: "https://example.com/avatar.jpg",
				bio: "I am a user.",
			}),
		});

		// 使用非严格模式 - 使用最后一个实现
		FuncBox([UserImpl_1, UserImpl_2], (As) => {
			const as_user = As(user);
			as_user.setName("Bob"); // 将使用 UserImpl_2 的实现（转小写）
		});

		// 在函数域内调用方法
		FuncBox([UserImpl_1, UserImpl_2], (As) => {
			const as_user = As(user);
			as_user.setEmail(123);
			as_user.birthday();
			console.log(as_user.getInfo()); // 输出: Name: Bob, Age: 26, Email: user123@example.com
		});

		// 使用示例：返回值
		const result = FuncBox([UserImpl_1, UserImpl_2], (As) => {
			const as_user = As(user);
			as_user.setName("Bob");
			return as_user.getInfo(); // 现在可以返回值
		});
		console.log("Return value:", result);

		// 修改 User2 定义
		const User2 = WithStruct(
			{
				name: String,
				age: Number,
				email: String,
			},
			{
				onNew: () => (init) => {
					console.log(`User2 created: ${init.name}`);
				},
				setName: (self, name: string) => {
					self.name = name;
				},
				setEmail: (self, id: number) => {
					self.email = `user${id}@example.com`;
				},
			}
		);

		const user2 = User2.new({
			name: "Charlie",
			age: 30,
			email: "charlie@example.com",
		});

		// 对于User2，方法是全局可用的
		user2.setName("David");
		user2.setEmail(456);
		console.log(user2.name); // 输出: David
		console.log(user2.email); // 输出: user456@example.com

		// 添加 PetDefinition 类型
		type PetDefinition = {
			name: StringConstructor;
			species: StringConstructor;
			age: NumberConstructor;
		};

		// 修改 Pet 结构体定义
		const Pet = Struct<PetDefinition>({
			name: String,
			species: String,
			age: Number,
		});

		// 修改 PetImpl 定义，使用正确的类型
		const PetImpl = Impl(Pet, {
			makeSound: (self: StructValue<PetDefinition>) => {
				console.log(`${self.name} makes a sound!`);
			},
		} as const);

		// 使用示例
		const user3 = User.new({
			name: "Alice",
			age: 25,
			email: "alice@example.com",
		});

		const pet = Pet.new({
			name: "Fluffy",
			species: "Cat",
			age: 3,
		});

		// MultiFuncBox 返回值示例
		const multiResult = MultiFuncBox(
			[UserImpl_1, UserImpl_2, PetImpl],
			(As) => {
				const as_user = As(user3, 0);
				const as_pet = As(pet, 2);

				as_user.setName("Bob");
				as_pet.makeSound();

				return {
					userInfo: as_user.getInfo(),
					petName: as_pet.name,
				};
			}
		);
		console.log("Multi return value:", multiResult);
	});
});
