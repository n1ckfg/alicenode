#ifndef AL_POD_H
#define AL_POD_H

#include "al_math.h"

/*
	A collection of data structures for algorithms
	that work with Plain Old Data (POD) types only
	That means, **no pointers and no virtuals**

	POD types are thus fully serializable and resumable;
	amenable to network streaming, mmap, memcpy, etc. 

	Identities must be representecd by array indices of where they are primarily stored
	Linked lists need to be arrays of such indices
	etc. 
*/



/*
	a super-simple stack to store up to N IDs. 
	Assuming T is POD-friendly, so is this:
*/
template<int N=128, typename T=int32_t>
struct Lifo {
	T list[N];
	int64_t count;
	
	void init(bool prefill=false) {
		count = 0;
		if (prefill) {
			for (count=0; count<N; ) push(T(count));
		}
	}
	
	bool push(T name) {
		if (count < N) {
			list[count] = name;
			count++;
			return true;
		}
		return false;
	}
	

	T pop() {
		if (count > 0) {
			count--;
			return list[count];
		}
		return T(-1);
	}
	
	int available() { return count; }
	int empty() { return count <= 0; }
};

/*
	A simple base-class for objects that are typed and located within a list
*/
struct TypedIdentity {
	int32_t type = 0;
	int32_t idx = 0;
};

/*
	A very simplistic 2D neighbourhood storage
	Each cell can only record zero or one occupants at a time
	No pointers or virtuals, thus POD-friendly
*/
template<int SPACE_DIM, typename T=int32_t, T invalid=T(-1)>
struct CellSpace {

	T cells[SPACE_DIM * SPACE_DIM];

	// notice that it isn't bounds-checking
	static const int32_t raw_index(glm::vec2 pos) {
		return int32_t(pos.x * SPACE_DIM) + int32_t(pos.y * SPACE_DIM)*SPACE_DIM;
	}

	// notice that it isn't bounds-checking
	static const int32_t safe_index(glm::vec2 pos) {
		return wrap(int32_t(pos.x * SPACE_DIM), SPACE_DIM) 
			 + wrap(int32_t(pos.y * SPACE_DIM), SPACE_DIM)*SPACE_DIM;
	}
	
	void unset(glm::vec2 pos) {
		cells[raw_index(pos)] = invalid;
	}

	void unset_safe(glm::vec2 pos) {
		cells[safe_index(pos)] = invalid;
	}
	
	void set(T& a, glm::vec2 pos) {
		cells[raw_index(pos)] = a;
	}
	
	void set_safe(T& a, glm::vec2 pos) {
		cells[safe_index(pos)] = a;
	}
	
	T get(glm::vec2 pos) {
		return cells[raw_index(pos)];
	}
	
	T get_safe(glm::vec2 pos) {
		return cells[safe_index(pos)];
	}
	
	void reset() {
		for (int i=0; i<SPACE_DIM * SPACE_DIM; i++) {
			cells[i] = invalid;
		}
	}
};

template<int DIM=32, typename T=float>
struct Field2DPod {

	Field2DPod() { reset(); }

	void reset() {
		memset(data0, 0, sizeof(data0));
		memset(data1, 0, sizeof(data1));
	}

	T * data(bool back=false) { return (!isSwapped != !back) ? data1 : data0; }
	const T * data(bool back=false) const { return (!isSwapped != !back) ? data1 : data0; }

	T * front() { return data(0); }
	T * back() { return data(1); }

	// copy(0) will copy from front to back
	// copy(1) will copy from back to front
	void copy(bool backtofront=false) {
		memcpy(data(!backtofront), data(backtofront), sizeof(T)*length());
	}

	size_t length() const { return DIM*DIM; }
	glm::ivec2 dim() const { return glm::ivec2(DIM, DIM); }

	void swap() { isSwapped = !isSwapped; }

	T data0[DIM*DIM];
	T data1[DIM*DIM];
	int isSwapped = 0;
};

template<int DIM=32, typename T=float>
struct Field3DPod {

	Field3DPod() { reset(); }

	void reset() {
		memset(data0, 0, sizeof(data0));
		memset(data1, 0, sizeof(data1));
	}

	T * data(bool back=false) { return (!isSwapped != !back) ? data1 : data0; }
	const T * data(bool back=false) const { return (!isSwapped != !back) ? data1 : data0; }

	T * front() { return data(0); }
	T * back() { return data(1); }

	// copy(0) will copy from front to back
	// copy(1) will copy from back to front
	void copy(bool backtofront=false) {
		memcpy(data(!backtofront), data(backtofront), sizeof(T)*length());
	}

	size_t length() const { return DIM*DIM*DIM; }
	glm::ivec3 dim() const { return glm::ivec3(DIM, DIM, DIM); }

	void swap() { isSwapped = !isSwapped; }

	T data0[DIM*DIM*DIM];
	T data1[DIM*DIM*DIM];
	int isSwapped = 0;
};

#endif // AL_POD_H